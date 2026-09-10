import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PostEntity } from '@/entities/post'

const loadInitialPostMocks = vi.hoisted(() => ({
  getCachedInitialPost: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('./loadInitialPost', () => ({
  getCachedInitialPost: loadInitialPostMocks.getCachedInitialPost,
}))

vi.mock('next/navigation', () => ({
  notFound: navigationMocks.notFound,
}))

import { generatePostDetailsMetadata } from './generatePostDetailsMetadata'

function createPost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [],
    author: {
      displayName: 'Backend Author',
      id: 'owner-1',
      profilePictureFileId: null,
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

describe('generatePostDetailsMetadata', () => {
  afterEach(() => {
    loadInitialPostMocks.getCachedInitialPost.mockReset()
    navigationMocks.notFound.mockClear()
  })

  it('uses the cached post for title and description', async () => {
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce({
      baselineKey: 'baseline-1',
      post: createPost(),
    })

    await expect(generatePostDetailsMetadata('post-1')).resolves.toEqual({
      description: 'Original description',
      title: 'Backend Author',
    })
    expect(loadInitialPostMocks.getCachedInitialPost).toHaveBeenCalledWith('post-1')
  })

  it('falls back to username and a generated description', async () => {
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce({
      baselineKey: 'baseline-1',
      post: createPost({
        author: {
          displayName: '   ',
          id: 'owner-1',
          profilePictureFileId: null,
          username: 'backend_author',
        },
        description: null,
      }),
    })

    await expect(generatePostDetailsMetadata('post-1')).resolves.toEqual({
      description: 'Post by backend_author',
      title: 'backend_author',
    })
  })

  it('calls notFound when the post is missing', async () => {
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce(null)

    await expect(generatePostDetailsMetadata('missing-post')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1)
  })
})
