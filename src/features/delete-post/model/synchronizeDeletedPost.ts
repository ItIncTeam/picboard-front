import { feedQuery, revalidatePublicHome } from '@/entities/post'
import { apolloClient } from '@/shared/api'

type PostDeleteSyncOperation = 'feed' | 'public-home'

function startSyncOperation(operation: () => PromiseLike<unknown> | unknown): Promise<unknown> {
  try {
    return Promise.resolve(operation())
  } catch (error) {
    return Promise.reject(error)
  }
}

function logSyncFailure(operation: PostDeleteSyncOperation, postId: string, reason: unknown): void {
  console.error('[DeletePost] post-delete synchronization failed', {
    operation,
    postId,
    reason,
  })
}

export async function synchronizeDeletedPost(postId: string): Promise<void> {
  const feedSync = startSyncOperation(() =>
    apolloClient.refetchQueries({
      include: [feedQuery],
      updateCache(cache) {
        cache.evict({
          fieldName: 'feed',
          id: 'ROOT_QUERY',
        })
      },
    }),
  )
  const publicHomeInvalidation = startSyncOperation(revalidatePublicHome)
  const [feedResult, publicHomeResult] = await Promise.allSettled([
    feedSync,
    publicHomeInvalidation,
  ])

  if (feedResult.status === 'rejected') {
    logSyncFailure('feed', postId, feedResult.reason)
  }

  if (publicHomeResult.status === 'rejected') {
    logSyncFailure('public-home', postId, publicHomeResult.reason)
  }
}
