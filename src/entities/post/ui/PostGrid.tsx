'use client'

import type { Post } from '@/entities/post'
import { PostCard } from '@/entities/post/ui/PostCard'
import { PostCardSkeleton } from '@/entities/post/ui/PostCardSkeleton'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import styles from './post.module.css'

const DEFAULT_SKELETON_COUNT = 8

type PostGridProps = {
  posts?: Post[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  returnTo?: string
  skeletonCount?: number
}

export function PostGrid({
  posts = [],
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  returnTo,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: PostGridProps) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label={t.posts.grid.loading} className={styles.grid} role="status">
        {Array.from({ length: skeletonCount }, (_, index) => {
          return <PostCardSkeleton key={`post-skeleton-${index}`} />
        })}
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.error} role="alert">
        <p className={styles.errorTitle}>{errorMessage ?? t.posts.grid.errorTitle}</p>
        <p className={styles.errorDescription}>{t.posts.grid.errorDescription}</p>
        {onRetry && (
          <Button className={styles.errorAction} onClick={onRetry} type="button" variant="outlined">
            {t.posts.grid.tryAgain}
          </Button>
        )}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>{t.posts.grid.emptyTitle}</p>
        <p className={styles.emptyDescription}>{t.posts.grid.emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => {
        return <PostCard key={post.id} post={post} returnTo={returnTo} />
      })}
    </div>
  )
}
