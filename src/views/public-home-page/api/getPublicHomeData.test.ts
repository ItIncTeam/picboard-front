import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPublicHomeData } from './getPublicHomeData'

const graphqlEndpoint = 'https://gateway.example.test/api/v1'

describe('getPublicHomeData', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('loads public home data from the configured GraphQL endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: {
          feed: [
            createPost('post-1', 'First caption', 'https://example.com/image-1.jpg'),
            createPost('post-2', 'Second caption', 'https://example.com/image-2.jpg'),
            createPost('post-3', 'Third caption', 'https://example.com/image-3.jpg'),
            createPost('post-4', 'Fourth caption', 'https://example.com/image-4.jpg'),
            createPost('post-5', 'Fifth caption', 'https://example.com/image-5.jpg'),
          ],
          usersCount: 9213,
        },
      }),
      ok: true,
    })

    globalThis.fetch = fetchMock

    await expect(getPublicHomeData()).resolves.toEqual({
      posts: [
        {
          authorAvatarUrl: '',
          authorName: 'User owner-post-1',
          caption: 'First caption',
          createdAtLabel: '2026-08-05T10:00:00.000Z',
          id: 'post-1',
          imageAlt: 'post-1.jpg',
          imageUrl: 'https://example.com/image-1.jpg',
        },
        {
          authorAvatarUrl: '',
          authorName: 'User owner-post-2',
          caption: 'Second caption',
          createdAtLabel: '2026-08-05T10:00:00.000Z',
          id: 'post-2',
          imageAlt: 'post-2.jpg',
          imageUrl: 'https://example.com/image-2.jpg',
        },
        {
          authorAvatarUrl: '',
          authorName: 'User owner-post-3',
          caption: 'Third caption',
          createdAtLabel: '2026-08-05T10:00:00.000Z',
          id: 'post-3',
          imageAlt: 'post-3.jpg',
          imageUrl: 'https://example.com/image-3.jpg',
        },
        {
          authorAvatarUrl: '',
          authorName: 'User owner-post-4',
          caption: 'Fourth caption',
          createdAtLabel: '2026-08-05T10:00:00.000Z',
          id: 'post-4',
          imageAlt: 'post-4.jpg',
          imageUrl: 'https://example.com/image-4.jpg',
        },
      ],
      usersCount: 9213,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      graphqlEndpoint,
      expect.objectContaining({
        body: expect.stringContaining('query Homepage'),
        method: 'POST',
        next: {
          revalidate: 60,
        },
      }),
    )
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain('usersCount')
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain('feed')
  })

  it('returns fallback public home data when endpoint is not configured', async () => {
    const fetchMock = vi.fn()

    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', '')
    globalThis.fetch = fetchMock

    await expect(getPublicHomeData()).resolves.toEqual({
      posts: [],
      usersCount: 0,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns fallback public home data when the request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(getPublicHomeData()).resolves.toEqual({
      posts: [],
      usersCount: 0,
    })
  })

  it('keeps available users count when GraphQL returns partial data with errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: {
          feed: [
            {
              attachments: [
                {
                  file: null,
                },
              ],
              description: null,
              id: 'post-without-file',
            },
          ],
          usersCount: 40,
        },
        errors: [
          {
            message: 'Internal server error',
          },
        ],
      }),
      ok: true,
    })

    await expect(getPublicHomeData()).resolves.toEqual({
      posts: [],
      usersCount: 40,
    })
  })
})

function createPost(id: string, description: string, imageUrl: string) {
  return {
    attachments: [
      {
        file: {
          originalName: `${id}.jpg`,
          url: imageUrl,
        },
        fileId: `${id}-file`,
        order: 0,
      },
    ],
    createdAt: '2026-08-05T10:00:00.000Z',
    description,
    id,
    ownerId: `owner-${id}`,
  }
}
