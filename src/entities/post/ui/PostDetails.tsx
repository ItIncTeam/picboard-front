import type { ReactNode } from 'react'

import type { PostAuthor } from '../model/backendTypes'
import styles from './post.module.css'

type PostDetailsProps = {
  author: PostAuthor
  caption?: string
  createdAt?: string
  createdAtLabel?: string
  headerAction?: ReactNode
  media: ReactNode
}

export function PostDetails({
  author,
  caption,
  createdAt,
  createdAtLabel,
  headerAction,
  media,
}: PostDetailsProps) {
  const authorName = author.displayName?.trim() || author.username
  const avatarFallback = authorName.charAt(0).toUpperCase()

  return (
    <article aria-label="Post details" className={styles.details}>
      <div className={styles.media}>{media}</div>

      <div className={styles.detailsBody}>
        <header className={styles.authorRow}>
          <span aria-label={`${authorName} avatar`} className={styles.avatar} role="img">
            {avatarFallback}
          </span>
          <span className={styles.authorName}>{authorName}</span>
          {headerAction ? <div className={styles.headerActions}>{headerAction}</div> : null}
        </header>

        <div className={styles.detailsContent}>
          {caption ? <p className={styles.detailsCaption}>{caption}</p> : null}
        </div>

        {createdAtLabel ? (
          <time className={styles.detailsMeta} dateTime={createdAt}>
            {createdAtLabel}
          </time>
        ) : null}
      </div>
    </article>
  )
}
