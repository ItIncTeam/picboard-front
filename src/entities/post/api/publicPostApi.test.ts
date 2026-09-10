import { print } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PostEntity } from '@/entities/post'
import { postQuery } from './postQuery'
import { getPostQueryData } from './publicPostApi'

const graphqlEndpoint = 'https://gateway.example.test/api/v1'

function createPostEntity(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: 'file-1',
          mimeType: 'JPEG',
          originalName: 'first.jpg',
          ownerId: 'user-1',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: 'https://cdn.example/first.jpg',
        },
        fileId: 'file-1',
        sortOrder: 1,
      },
    ],
    author: {
      displayName: 'Backend Author',
      id: 'user-1',
      profilePictureFileId: null,
      username: 'backend_author',
    },
    createdAt: '2026-07-04T12:00:00.000Z',
    description: 'Post description',
    id: 'post-1',
    ownerId: 'user-1',
    updatedAt: '2026-07-04T12:10:00.000Z',
    ...overrides,
  }
}

function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('Public Post GraphQL boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uses the existing Post document with PostFields', () => {
    const document = print(postQuery)
    const compactDocument = document.replace(/\s+/g, ' ')

    expect(compactDocument).toContain(
      'query Post($id: String!) { post(id: $id) { ...PostFields } }',
    )
    expect(compactDocument).toContain('ownerId')
    expect(compactDocument).toContain('attachments { fileId sortOrder file {')
    expect(compactDocument).toContain('author { id username displayName profilePictureFileId }')
  })

  it('fetches a complete post without caching or auth headers', async () => {
    const payload = createPostEntity()
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse({
        data: {
          post: payload,
        },
      }),
    )

    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPostQueryData('post-1')).resolves.toEqual(payload)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      graphqlEndpoint,
      expect.objectContaining({
        cache: 'no-store',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(request.body)) as {
      query: string
      variables: { id: string }
    }

    expect(request.credentials).toBeUndefined()
    expect(body.variables).toEqual({ id: 'post-1' })
    expect(body.query).toContain('query Post($id: String!)')
  })

  it('rejects a payload without a post field', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          data: {},
        }),
      ),
    )

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        kind: 'graphql',
      }),
    )
  })

  it('returns null when the post is confirmed missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          data: {
            post: null,
          },
        }),
      ),
    )

    await expect(getPostQueryData('missing-post')).resolves.toBeNull()
  })

  it('accepts a nullable attachment file on an otherwise complete post', async () => {
    const payload = createPostEntity({
      attachments: [
        {
          file: null,
          fileId: 'file-without-entity',
          sortOrder: 0,
        },
      ],
    })

    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          data: {
            post: payload,
          },
        }),
      ),
    )

    await expect(getPostQueryData('post-1')).resolves.toEqual(payload)
  })

  it('rejects GraphQL errors instead of returning a post', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          data: {
            post: createPostEntity(),
          },
          errors: [{ message: 'Gateway unavailable' }],
        }),
      ),
    )

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        errorCount: 1,
        errors: ['Gateway unavailable'],
        kind: 'graphql',
      }),
    )
  })

  it('rejects an incomplete post payload', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const incompletePost = {
      author: {
        displayName: 'Backend Author',
        id: 'user-1',
        profilePictureFileId: null,
        username: 'backend_author',
      },
      createdAt: '2026-07-04T12:00:00.000Z',
      description: 'Post description',
      id: 'post-1',
    }

    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          data: {
            post: incompletePost,
          },
        }),
      ),
    )

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        kind: 'graphql',
        message: 'Post payload is incomplete.',
      }),
    )
  })

  it('rejects invalid JSON instead of returning a post', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', { status: 200 })))

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        kind: 'transport',
      }),
    )
  })

  it('logs minimal HTTP diagnostics without reading the response body', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const text = vi.fn()
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text,
      } as unknown as Response),
    )

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(text).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        kind: 'http',
        status: 502,
        statusText: 'Bad Gateway',
      }),
    )
  })

  it('logs the safe transport cause when server fetch rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const cause = Object.assign(new Error('self-signed certificate'), {
      code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
    })
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause })))

    await expect(getPostQueryData('post-1')).rejects.toThrow(
      'Post data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicPost] request failed',
      expect.objectContaining({
        code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
        endpoint: graphqlEndpoint,
        kind: 'transport',
        message: 'self-signed certificate',
        name: 'Error',
      }),
    )
  })
})
