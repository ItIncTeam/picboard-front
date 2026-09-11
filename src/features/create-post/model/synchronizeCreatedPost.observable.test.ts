import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  profilePostsQuery,
  type PostConnection,
  type ProfilePostsQueryData,
  type ProfilePostsQueryVariables,
} from '@/entities/post'

const { revalidatePublicHome } = vi.hoisted(() => ({
  revalidatePublicHome: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/entities/post/server', () => ({
  revalidatePublicHome,
}))

function createConnection(postIds: string[]): PostConnection {
  return {
    edges: postIds.map((id) => ({
      cursor: `cursor-${id}`,
      node: {
        __typename: 'PostEntity',
        attachments: [],
        author: {
          displayName: null,
          id: 'owner-1',
          profilePictureFileId: null,
          username: 'owner',
        },
        createdAt: '2026-08-31T12:00:00.000Z',
        description: id,
        id,
        ownerId: 'owner-1',
        updatedAt: '2026-08-31T12:00:00.000Z',
      },
    })),
    pageInfo: {
      endCursor: postIds.at(-1) ? `cursor-${postIds.at(-1)}` : null,
      hasNextPage: false,
      startCursor: postIds[0] ? `cursor-${postIds[0]}` : null,
    },
  } as PostConnection
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }

  throw lastError
}

describe('synchronizeCreatedPost with an active Profile query', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('refetches the mounted owner first page immediately after targeted eviction', async () => {
    const responses = [createConnection(['existing-post']), createConnection(['new-post'])]
    let requestCount = 0
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            const profilePosts = responses[Math.min(requestCount, responses.length - 1)]
            requestCount += 1
            observer.next({ data: { profilePosts } })
            observer.complete()
          }),
      ),
    })

    vi.doMock('@/shared/api', () => ({ apolloClient: client }))
    const { synchronizeCreatedPost } = await import('./synchronizeCreatedPost')
    const receivedPostIds: string[][] = []
    const observable = client.watchQuery<ProfilePostsQueryData, ProfilePostsQueryVariables>({
      query: profilePostsQuery,
      variables: { input: { first: 8, userId: 'owner-1' } },
    })
    const subscription = observable.subscribe(({ data, dataState }) => {
      if (dataState === 'complete') {
        receivedPostIds.push(data.profilePosts.edges.map(({ node }) => node.id))
      }
    })

    await waitFor(() => expect(receivedPostIds).toContainEqual(['existing-post']))
    await synchronizeCreatedPost('new-post', 'owner-1')
    await waitFor(() => expect(receivedPostIds.at(-1)).toEqual(['new-post']))

    expect(requestCount).toBe(2)
    expect(revalidatePublicHome).toHaveBeenCalledTimes(1)

    subscription.unsubscribe()
    client.stop()
  })
})
