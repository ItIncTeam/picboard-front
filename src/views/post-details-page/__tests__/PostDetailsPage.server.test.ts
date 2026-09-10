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

vi.mock('../api/loadInitialPost', () => ({
  getCachedInitialPost: loadInitialPostMocks.getCachedInitialPost,
}))

vi.mock('next/navigation', () => ({
  notFound: navigationMocks.notFound,
}))

vi.mock('../PostDetailsContent', () => ({
  PostDetailsContent: ({ data }: { data: { baselineKey: string } }) => data.baselineKey,
}))

import { PostDetailsPage } from '../PostDetailsPage'

function createPost(): PostEntity {
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
  }
}

describe('PostDetailsPage', () => {
  afterEach(() => {
    loadInitialPostMocks.getCachedInitialPost.mockReset()
    navigationMocks.notFound.mockClear()
  })

  it('renders the cached post without a second loader call from the view itself', async () => {
    const post = createPost()
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce({
      baselineKey: 'baseline-1',
      post,
    })

    const view = await PostDetailsPage({ postId: 'post-1' })

    expect(loadInitialPostMocks.getCachedInitialPost).toHaveBeenCalledWith('post-1')
    expect(navigationMocks.notFound).not.toHaveBeenCalled()
    expect(view).toBeTruthy()
  })

  it('calls notFound when the post is missing', async () => {
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce(null)

    await expect(PostDetailsPage({ postId: 'missing-post' })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1)
  })
})
