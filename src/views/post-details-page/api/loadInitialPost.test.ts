import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as PostEntityModule from '@/entities/post'
import type { PostEntity } from '@/entities/post'

const postApiMocks = vi.hoisted(() => ({
  getPostQueryData: vi.fn(),
}))

vi.mock('@/entities/post', async (importOriginal) => {
  const originalModule = await importOriginal<typeof PostEntityModule>()

  return {
    ...originalModule,
    getPostQueryData: postApiMocks.getPostQueryData,
  }
})

import { loadInitialPost } from './loadInitialPost'

function createPostEntity(): PostEntity {
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
  }
}

describe('loadInitialPost', () => {
  afterEach(() => {
    postApiMocks.getPostQueryData.mockReset()
    vi.restoreAllMocks()
  })

  it('returns a serializable post with a new baseline key', async () => {
    const post = createPostEntity()
    postApiMocks.getPostQueryData.mockResolvedValueOnce(post)
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('11111111-1111-4111-8111-111111111111')

    await expect(loadInitialPost('post-1')).resolves.toEqual({
      baselineKey: '11111111-1111-4111-8111-111111111111',
      post,
    })
    expect(postApiMocks.getPostQueryData).toHaveBeenCalledWith('post-1')
  })

  it('creates a new baseline for each successful load', async () => {
    const post = createPostEntity()
    postApiMocks.getPostQueryData.mockResolvedValue(post)

    const first = await loadInitialPost('post-1')
    const second = await loadInitialPost('post-1')

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(first?.post).toEqual(post)
    expect(second?.post).toEqual(post)
    expect(first?.baselineKey).not.toEqual(second?.baselineKey)
  })

  it('keeps a confirmed missing post distinct from an error', async () => {
    postApiMocks.getPostQueryData.mockResolvedValueOnce(null)

    await expect(loadInitialPost('missing-post')).resolves.toBeNull()
  })

  it('propagates a gateway failure to the route error boundary', async () => {
    postApiMocks.getPostQueryData.mockRejectedValueOnce(new Error('Gateway error'))

    await expect(loadInitialPost('post-1')).rejects.toThrow('Gateway error')
  })
})
