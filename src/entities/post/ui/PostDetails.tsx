import type { ReactNode } from 'react'

import styles from './post.module.css'

type PostDetailsProps = {
  authorName: string
  caption?: string
  createdAt?: string
  createdAtLabel?: string
  headerAction?: ReactNode
  media: ReactNode
}

export function PostDetails({
  authorName,
  caption,
  createdAt,
  createdAtLabel,
  headerAction,
  media,
}: PostDetailsProps) {
  return (
    <article aria-label="Post details" className={styles.details}>
      <div className={styles.media}>{media}</div>

      <div className={styles.detailsBody}>
        <header className={styles.authorRow}>
          <span aria-hidden className={styles.avatar}>
            U
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
