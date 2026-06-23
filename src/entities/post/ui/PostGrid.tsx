import type { Post } from '@/entities/post'
import { PostCard } from '@/entities/post/ui/PostCard'
import { PostCardSkeleton } from '@/entities/post/ui/PostCardSkeleton'
import styles from './post.module.css'

const DEFAULT_SKELETON_COUNT = 8

type PostGridProps = {
  posts?: Post[]
  isLoading?: boolean
  skeletonCount?: number
}

export function PostGrid({
  posts = [],
  isLoading = false,
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
