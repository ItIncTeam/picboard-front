import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { feedQuery } from '@/entities/post'

import { synchronizeCreatedPost } from './synchronizeCreatedPost'

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

vi.mock('../api/revalidatePublicHome', () => ({
  revalidatePublicHome: synchronizationMocks.revalidatePublicHome,
}))

describe('synchronizeCreatedPost', () => {
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
    await expect(synchronizeCreatedPost('post-1')).resolves.toBeUndefined()

    expect(synchronizationMocks.refetchQueries).toHaveBeenCalledWith({
      include: [feedQuery],
      updateCache: expect.any(Function),
    })
    expect(synchronizationMocks.evict).toHaveBeenCalledWith({
      fieldName: 'feed',
      id: 'ROOT_QUERY',
    })
    expect(synchronizationMocks.revalidatePublicHome).toHaveBeenCalledTimes(1)
  })

  it('isolates and identifies a Feed synchronization failure', async () => {
    const feedError = new Error('Feed unavailable.')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    synchronizationMocks.refetchQueries.mockRejectedValueOnce(feedError)

    await expect(synchronizeCreatedPost('post-feed-failure')).resolves.toBeUndefined()

    expect(synchronizationMocks.revalidatePublicHome).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith('[CreatePost] post-create synchronization failed', {
      operation: 'feed',
      postId: 'post-feed-failure',
      reason: feedError,
    })
  })

  it('isolates and identifies a Public Home invalidation failure', async () => {
    const invalidationError = new Error('Invalidation unavailable.')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    synchronizationMocks.revalidatePublicHome.mockRejectedValueOnce(invalidationError)

    await expect(synchronizeCreatedPost('post-invalidation-failure')).resolves.toBeUndefined()

    expect(synchronizationMocks.refetchQueries).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith('[CreatePost] post-create synchronization failed', {
      operation: 'public-home',
      postId: 'post-invalidation-failure',
      reason: invalidationError,
    })
  })

  it('treats the absence of an active Feed query as a successful no-op', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(synchronizeCreatedPost('post-without-active-feed')).resolves.toBeUndefined()

    expect(synchronizationMocks.evict).toHaveBeenCalledWith({
      fieldName: 'feed',
      id: 'ROOT_QUERY',
    })
    expect(synchronizationMocks.revalidatePublicHome).toHaveBeenCalledTimes(1)
    expect(consoleError).not.toHaveBeenCalled()
  })
})
