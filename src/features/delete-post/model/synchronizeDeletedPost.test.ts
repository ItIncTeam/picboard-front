import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { feedQuery, profilePostsQuery } from '@/entities/post'

import { synchronizeDeletedPost } from './synchronizeDeletedPost'

const synchronizationMocks = vi.hoisted(() => ({
  evict: vi.fn(),
  refetchQueries: vi.fn(),
  revalidatePublicHome: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    refetchQueries: synchronizationMocks.refetchQueries,
  },
}))

vi.mock('@/entities/post', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/post')>()),
  revalidatePublicHome: synchronizationMocks.revalidatePublicHome,
}))

describe('synchronizeDeletedPost', () => {
  beforeEach(() => {
    synchronizationMocks.evict.mockReset()
    synchronizationMocks.refetchQueries.mockReset()
    synchronizationMocks.revalidatePublicHome.mockReset()
    synchronizationMocks.refetchQueries.mockImplementation(
      ({
        updateCache,
      }: {
        updateCache: (cache: { evict: typeof synchronizationMocks.evict }) => void
      }) => {
        updateCache({ evict: synchronizationMocks.evict })

        return Promise.resolve([])
      },
    )
    synchronizationMocks.revalidatePublicHome.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('evicts ROOT_QUERY.feed, refetches active Feed, and invalidates Public Home', async () => {
    await expect(synchronizeDeletedPost('post-1')).resolves.toBeUndefined()

    expect(synchronizationMocks.refetchQueries).toHaveBeenCalledWith({
      include: [feedQuery, profilePostsQuery],
      updateCache: expect.any(Function),
    })
    expect(synchronizationMocks.evict).toHaveBeenCalledWith({
      fieldName: 'feed',
      id: 'ROOT_QUERY',
    })
    expect(synchronizationMocks.revalidatePublicHome).toHaveBeenCalledTimes(1)
  })

  it('evicts profile posts so a deleted post does not stay on profile pages', async () => {
    await expect(synchronizeDeletedPost('profile-post')).resolves.toBeUndefined()

    expect(synchronizationMocks.evict).toHaveBeenCalledWith({
      fieldName: 'profilePosts',
      id: 'ROOT_QUERY',
    })
  })

  it('isolates and identifies a Feed synchronization failure', async () => {
    const feedError = new Error('Feed unavailable.')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    synchronizationMocks.refetchQueries.mockRejectedValueOnce(feedError)

    await expect(synchronizeDeletedPost('post-feed-failure')).resolves.toBeUndefined()

    expect(synchronizationMocks.revalidatePublicHome).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith('[DeletePost] post-delete synchronization failed', {
      operation: 'feed',
      postId: 'post-feed-failure',
      reason: feedError,
    })
  })

  it('isolates and identifies a Public Home invalidation failure', async () => {
    const invalidationError = new Error('Invalidation unavailable.')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    synchronizationMocks.revalidatePublicHome.mockRejectedValueOnce(invalidationError)

    await expect(synchronizeDeletedPost('post-invalidation-failure')).resolves.toBeUndefined()

    expect(synchronizationMocks.refetchQueries).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith('[DeletePost] post-delete synchronization failed', {
      operation: 'public-home',
      postId: 'post-invalidation-failure',
      reason: invalidationError,
    })
  })
})
