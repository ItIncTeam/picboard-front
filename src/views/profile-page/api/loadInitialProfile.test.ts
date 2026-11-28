import { parse, visit, print, type SelectionSetNode } from 'graphql'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { profilePostsQuery, PROFILE_POSTS_PAGE_SIZE } from '@/entities/post/api/postsApi'

import { initialProfileQuery } from './initialProfileQuery'
import { loadInitialProfile } from './loadInitialProfile'

vi.mock('@/shared/api', () => ({ apolloClient: {} }))

const endpoint = 'https://gateway.example.test/api/v1'
const fetchMock = vi.fn<typeof fetch>()

function createData() {
  const author = {
    __typename: 'User',
    id: 'user-1',
    username: 'username',
    displayName: null,
    profilePictureFileId: null,
    avatar: { __typename: 'File', id: 'avatar-1', url: 'https://cdn.example/avatar.jpg' },
  }
  return {
    user: { ...author, aboutMe: 'About me' },
    profilePosts: {
      __typename: 'PostConnection',
      edges: [
        {
          __typename: 'PostEdge',
          cursor: 'cursor-1',
          node: {
            __typename: 'PostEntity',
            id: 'post-1',
            ownerId: 'user-1',
            author,
            description: null,
            createdAt: '2026-11-14T12:00:00Z',
            updatedAt: '2026-11-14T12:00:00Z',
            attachments: [
              {
                __typename: 'PostAttachmentEntity',
                fileId: 'file-1',
                sortOrder: 0,
                file: {
                  __typename: 'File',
                  id: 'file-1',
                  ownerId: 'user-1',
                  originalName: 'image.jpg',
                  purpose: 'POST_IMAGE',
                  mimeType: 'JPEG',
                  size: 1024,
                  status: 'READY',
                  url: 'https://cdn.example/image.jpg',
                },
              },
            ],
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: 'cursor-1',
        endCursor: 'cursor-1',
        hasNextPage: false,
      },
    },
  }
}

function respond(payload: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status }))
}

describe('loadInitialProfile', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', endpoint)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('loads user and first posts with one anonymous no-store POST and a serializable baseline', async () => {
    const data = createData()
    respond({ data })
    const uuid = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-4111-8111-111111111111')

    const result = await loadInitialProfile('user-1')

    expect(result).toEqual({
      user: data.user,
      posts: data.profilePosts,
      baselineKey: uuid.mock.results[0].value,
    })
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(endpoint, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: initialProfileQuery,
        variables: { id: 'user-1', input: { userId: 'user-1', first: PROFILE_POSTS_PAGE_SIZE } },
      }),
    })
    expect(initialProfileQuery).not.toMatch(
      /\b(bio|email|isConfirmed|publicationsCount|followersCount|followingCount|usersCount|after)\b/,
    )
    expect(initialProfileQuery).toContain('aboutMe')
  })

  it('keeps the profilePosts selection compatible with the client query, adding typenames', () => {
    const withoutTypenames = (query: string) =>
      visit(parse(query), {
        Field(node) {
          return node.name.value === '__typename' ? null : undefined
        },
      })
    const selection = (query: string) => {
      let fields: SelectionSetNode | undefined
      visit(withoutTypenames(query), {
        Field(node) {
          if (node.name.value === 'profilePosts') fields = node.selectionSet
        },
      })
      return print(fields!)
    }
    expect(selection(initialProfileQuery)).toBe(selection(print(profilePostsQuery)))
  })

  it('creates a fresh baseline per successful request', async () => {
    respond({ data: createData() })
    respond({ data: createData() })
    const first = await loadInitialProfile('user-1')
    const second = await loadInitialProfile('user-1')
    expect(first?.baselineKey).not.toBe(second?.baselineKey)
  })

  it('returns null only for a confirmed absent user', async () => {
    respond({ data: { ...createData(), user: null } })
    const uuid = vi.spyOn(crypto, 'randomUUID')
    await expect(loadInitialProfile('missing')).resolves.toBeNull()
    expect(uuid).not.toHaveBeenCalled()
  })

  it('accepts an empty first page and nullable optional fields', async () => {
    const data = createData()
    respond({
      data: {
        user: { ...data.user, avatar: null, aboutMe: null },
        profilePosts: {
          ...data.profilePosts,
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            startCursor: null,
            endCursor: null,
            hasNextPage: false,
          },
        },
      },
    })
    const result = await loadInitialProfile('user-1')
    expect(result?.posts.edges).toEqual([])
    expect(result?.user.aboutMe).toBeNull()
  })

  it.each([
    undefined,
    ['profilePosts', 'edges', 0, 'node', 'author'],
    ['profilePosts', 'edges', 0, 'node', 'author', 'username'],
    ['profilePosts', 'edges', 0, 'node', 'author', 'avatar', 'url'],
  ])('accepts null author with an optional author resolution error: %j', async (path) => {
    const data = createData()
    respond({
      data: {
        ...data,
        profilePosts: {
          ...data.profilePosts,
          edges: [
            {
              ...data.profilePosts.edges[0],
              node: { ...data.profilePosts.edges[0].node, author: null },
            },
          ],
        },
      },
      ...(path ? { errors: [{ message: 'Author unavailable', path }] } : {}),
    })
    const result = await loadInitialProfile('user-1')
    expect(result?.posts.edges[0].node.author).toBeNull()
  })

  it('accepts a partial nullable author avatar without losing the author', async () => {
    const data = createData()
    const node = data.profilePosts.edges[0].node
    respond({
      data: {
        ...data,
        profilePosts: {
          ...data.profilePosts,
          edges: [
            {
              ...data.profilePosts.edges[0],
              node: { ...node, author: { ...node.author, avatar: null } },
            },
          ],
        },
      },
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author', 'avatar', 'url'] }],
    })
    expect((await loadInitialProfile('user-1'))?.posts.edges[0].node.author?.avatar).toBeNull()
  })

  it('rejects author-related errors when author data is still present', async () => {
    respond({
      data: createData(),
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author'] }],
    })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it('accepts profilePictureFileId errors when that field is null', async () => {
    const data = createData()
    const node = data.profilePosts.edges[0].node
    respond({
      data: {
        ...data,
        profilePosts: {
          ...data.profilePosts,
          edges: [
            {
              ...data.profilePosts.edges[0],
              node: {
                ...node,
                author: { ...node.author, profilePictureFileId: null },
              },
            },
          ],
        },
      },
      errors: [
        {
          path: ['profilePosts', 'edges', 0, 'node', 'author', 'profilePictureFileId'],
        },
      ],
    })
    const result = await loadInitialProfile('user-1')
    expect(result?.posts.edges[0].node.author?.profilePictureFileId).toBeNull()
    expect(result?.posts.edges[0].node.author?.id).toBe('user-1')
  })

  it('rejects avatar-related errors when avatar data is still present', async () => {
    respond({
      data: createData(),
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author', 'avatar', 'url'] }],
    })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it.each([
    undefined,
    [],
    ['user'],
    ['user', 'avatar'],
    ['profilePosts'],
    ['profilePosts', 'edges', 0, 'node', 'description'],
    ['profilePosts', 'edges', 4, 'node', 'author'],
    ['profilePosts', 'edges', '0', 'node', 'author'],
    ['profilePosts', 'edges', 0, 'node', 'author', 'unknown'],
  ])('rejects unrelated or unclassifiable GraphQL errors: %j', async (path) => {
    respond({ data: createData(), errors: [{ message: 'Failure', path }] })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it('does not turn a null user with errors into a missing profile', async () => {
    respond({
      data: { ...createData(), user: null },
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author'] }],
    })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it('rejects mixed allowed and unrelated errors', async () => {
    respond({
      data: createData(),
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author'] }, { path: ['user'] }],
    })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it.each([
    {},
    { data: null },
    { data: { user: null } },
    { data: { ...createData(), user: { id: 'user-1' } } },
    { data: { ...createData(), profilePosts: { edges: [], pageInfo: null } } },
    {
      data: {
        ...createData(),
        profilePosts: { ...createData().profilePosts, edges: [{ cursor: 'cursor', node: null }] },
      },
    },
    { data: createData(), errors: 'Failure' },
  ])('rejects incomplete or malformed payloads: %j', async (payload) => {
    respond(payload)
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it('rejects missing post identity even with an allowed author error', async () => {
    const data = createData()
    const node = data.profilePosts.edges[0].node
    Reflect.deleteProperty(node, 'id')
    respond({
      data: {
        ...data,
        profilePosts: {
          ...data.profilePosts,
          edges: [
            {
              ...data.profilePosts.edges[0],
              node: { ...node, author: null },
            },
          ],
        },
      },
      errors: [{ path: ['profilePosts', 'edges', 0, 'node', 'author'] }],
    })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it.each(
    [
      ['user', '__typename'],
      ['user', 'aboutMe'],
      ['user', 'avatar', 'url'],
      ['profilePosts', '__typename'],
      ['profilePosts', 'edges', 0, '__typename'],
      ['profilePosts', 'edges', 0, 'cursor'],
      ['profilePosts', 'edges', 0, 'node', '__typename'],
      ['profilePosts', 'edges', 0, 'node', 'author', 'username'],
      ['profilePosts', 'edges', 0, 'node', 'attachments', 0, 'file', 'id'],
      ['profilePosts', 'pageInfo', 'hasNextPage'],
    ].map((path) => ({ path })),
  )('rejects a missing selected field at $path', async ({ path }) => {
    const data = createData()
    let parent: unknown = data
    for (const key of path.slice(0, -1)) {
      parent = (parent as Record<string | number, unknown>)[key]
    }
    Reflect.deleteProperty(parent as object, path[path.length - 1])
    respond({ data })
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it.each([404, 500])('treats HTTP %i as a technical failure', async (status) => {
    respond({ data: { ...createData(), user: null } }, status)
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it('propagates transport failures', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network unavailable'))
    await expect(loadInitialProfile('user-1')).rejects.toThrow('Network unavailable')
  })

  it('rejects invalid JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{ invalid'))
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
  })

  it.each(['', '/graphql'])('rejects missing or relative endpoint: %j', async (value) => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', value)
    await expect(loadInitialProfile('user-1')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
