import Image from 'next/image'

import { formatRelativePostTime } from '../lib/formatRelativePostTime'
import type { PublicPostCardModel } from '../model/types'
import styles from '../public-post-card.module.css'
import { PublicPostCarousel } from './PublicPostCarousel'
import { PublicPostDescription } from './PublicPostDescription'

type PublicPostCardProps = {
  post: PublicPostCardModel
}

export function PublicPostCard({ post }: PublicPostCardProps) {
  return (
    <article className={styles.card} data-post-id={post.id}>
      <PublicPostCarousel media={post.media} />

      <div className={styles.authorRow}>
        <span className={styles.avatar}>
          {post.author.avatarUrl ? (
            <Image alt="" fill sizes="36px" src={post.author.avatarUrl} unoptimized />
          ) : (
            <span aria-hidden>U</span>
          )}
        </span>
        <span className={styles.authorName}>{post.author.name}</span>
      </div>

      <time className={styles.createdAt} dateTime={post.createdAt}>
        {formatRelativePostTime(post.createdAt)}
      </time>
      <PublicPostDescription description={post.description} />
    </article>
  )
}
