import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core'
import { ApolloProvider } from '@apollo/client/react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { postQuery } from '@/entities/post/api/postQuery'
import type { PostEntity } from '@/entities/post/model/backendTypes'

import { useSeedPostDetailsCache } from '../useSeedPostDetailsCache'

type PostQueryData = {
  post: PostEntity | null
}

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createPost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: 'file-1',
          mimeType: 'JPEG',
          originalName: 'beach.jpg',
          ownerId: 'owner-1',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: 'https://example.com/beach.jpg',
        },
        fileId: 'file-1',
        sortOrder: 0,
      },
    ],
    author: {
      avatar: {
        id: 'avatar-file-1',
        url: 'https://example.com/avatar.jpg',
      },
      displayName: 'Backend Author',
      id: 'owner-1',
      profilePictureFileId: 'avatar-file-1',
      username: 'backend_author',
    },
    createdAt: '2026-08-20T12:00:00.000Z',
    description: 'Original description',
    id: 'post-1',
    ownerId: 'owner-1',
    updatedAt: '2026-08-20T12:00:00.000Z',
    ...overrides,
  }
}

function SeedHarness({ baselineKey, post }: { baselineKey: string; post: PostEntity }) {
  useSeedPostDetailsCache({ baselineKey, post })

  return <div>{post.description}</div>
}

describe('useSeedPostDetailsCache', () => {
  let networkCalls = 0
  let client: ApolloClient
  let view: RenderResult | null = null
  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    networkCalls = 0
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(() => {
        networkCalls += 1

        return new Observable((observer) => {
          observer.error(new Error('Unexpected network request during Apollo seed.'))
        })
      }),
    })
  })

  afterEach(() => {
    if (!view) {
      return
    }

    const currentView = view

    act(() => currentView.root.unmount())
    currentView.container.remove()
    view = null
  })

  async function waitFor(assertion: () => void): Promise<void> {
    let lastError: unknown

    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        assertion()
        return
      } catch (error) {
        lastError = error
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
        })
      }
    }

    throw lastError
  }

  function renderSeed(baselineKey: string, post: PostEntity): RenderResult {
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)
    act(() => {
      root.render(
        <ApolloProvider client={client}>
          <SeedHarness baselineKey={baselineKey} post={post} />
        </ApolloProvider>,
      )
    })

    const result = { container, root }
    view = result

    return result
  }

  it('writes the full postQuery into Apollo cache without a network request', async () => {
    const post = createPost()

    renderSeed('baseline-1', post)

    await waitFor(() => {
      const cached = client.readQuery<PostQueryData>({
        query: postQuery,
        variables: { id: 'post-1' },
      })

      expect(cached?.post?.id).toBe(post.id)
      expect(cached?.post?.description).toBe(post.description)
      expect(cached?.post?.ownerId).toBe(post.ownerId)
    })

    expect(networkCalls).toBe(0)
  })

  it('does not issue a network request while seeding a new baseline', async () => {
    const post = createPost()

    renderSeed('baseline-2', post)

    await waitFor(() => {
      expect(
        client.readQuery<PostQueryData>({
          query: postQuery,
          variables: { id: 'post-1' },
        })?.post?.id,
      ).toBe('post-1')
    })

    expect(networkCalls).toBe(0)
  })

  it('updates normalized PostEntity from a later mutation payload without refetch', async () => {
    const post = createPost()

    renderSeed('baseline-3', post)

    await waitFor(() => {
      expect(
        client.readQuery<PostQueryData>({
          query: postQuery,
          variables: { id: 'post-1' },
        })?.post?.id,
      ).toBe('post-1')
    })

    const updatedPost = createPost({ description: 'Updated description' })

    act(() => {
      client.writeQuery({
        data: {
          post: {
            ...updatedPost,
            __typename: 'PostEntity',
            attachments: updatedPost.attachments.map((attachment) => ({
              ...attachment,
              __typename: 'PostAttachmentEntity',
              file: attachment.file ? { ...attachment.file, __typename: 'File' } : null,
            })),
            author: {
              ...updatedPost.author,
              __typename: 'User',
              avatar: updatedPost.author.avatar
                ? { ...updatedPost.author.avatar, __typename: 'File' }
                : null,
            },
          },
        },
        query: postQuery,
        variables: { id: 'post-1' },
      })
    })

    const cached = client.readQuery<PostQueryData>({
      query: postQuery,
      variables: { id: 'post-1' },
    })
    expect(cached?.post?.description).toBe('Updated description')
    expect(networkCalls).toBe(0)
  })

  it('removes PostEntity from cache on delete eviction without refetch', async () => {
    const post = createPost()

    renderSeed('baseline-4', post)

    await waitFor(() => {
      expect(
        client.readQuery<PostQueryData>({
          query: postQuery,
          variables: { id: 'post-1' },
        })?.post?.id,
      ).toBe('post-1')
    })

    act(() => {
      const postCacheId = client.cache.identify({
        __typename: 'PostEntity',
        id: 'post-1',
      })

      if (postCacheId) {
        client.cache.evict({ id: postCacheId })
      }

      client.cache.gc()
    })

    expect(
      client.readQuery({
        query: postQuery,
        variables: { id: 'post-1' },
      }),
    ).toBeNull()
    expect(networkCalls).toBe(0)
  })
})
