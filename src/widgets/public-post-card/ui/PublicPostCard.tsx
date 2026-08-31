import { formatRelativePostTime } from '../lib/formatRelativePostTime'
import type { PublicPostCardModel } from '../model/types'
import styles from '../public-post-card.module.css'
import { PublicPostCarousel } from './PublicPostCarousel'
import { PublicPostDescription } from './PublicPostDescription'

type PublicPostCardProps = {
  post: PublicPostCardModel
}

export function PublicPostCard({ post }: PublicPostCardProps) {
  const authorName = post.author.displayName?.trim() || post.author.username
  const avatarFallback = authorName.charAt(0).toUpperCase()

  return (
    <article className={styles.card} data-post-id={post.id}>
      <PublicPostCarousel media={post.media} />

      <div className={styles.authorRow}>
        <span aria-label={`${authorName} avatar`} className={styles.avatar} role="img">
          <span aria-hidden>{avatarFallback}</span>
        </span>
        <span className={styles.authorName}>{authorName}</span>
      </div>

      <time className={styles.createdAt} dateTime={post.createdAt}>
        {formatRelativePostTime(post.createdAt)}
      </time>
      <PublicPostDescription description={post.description} />
    </article>
  )
}
