import type { Post } from '@/entities/post'
import { PostCard } from '@/entities/post/ui/PostCard'
import { PostCardSkeleton } from '@/entities/post/ui/PostCardSkeleton'
import { Button } from '@/shared/ui/button'
import styles from './post.module.css'

const DEFAULT_SKELETON_COUNT = 8
const DEFAULT_ERROR_TITLE = "Couldn't load publications"
const DEFAULT_ERROR_DESCRIPTION = 'Please try again in a moment.'

type PostGridProps = {
  posts?: Post[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  skeletonCount?: number
}

export function PostGrid({
  posts = [],
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: PostGridProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading publications" className={styles.grid} role="status">
        {Array.from({ length: skeletonCount }, (_, index) => {
          return <PostCardSkeleton key={`post-skeleton-${index}`} />
        })}
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.error} role="alert">
        <p className={styles.errorTitle}>{errorMessage ?? DEFAULT_ERROR_TITLE}</p>
        <p className={styles.errorDescription}>{DEFAULT_ERROR_DESCRIPTION}</p>
        {onRetry && (
          <Button className={styles.errorAction} onClick={onRetry} type="button" variant="outlined">
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>No publications yet</p>
        <p className={styles.emptyDescription}>
          Published posts will appear here once they are available.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => {
        return <PostCard key={post.id} post={post} />
      })}
    </div>
  )
}
