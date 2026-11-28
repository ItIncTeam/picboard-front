'use client'

import Image from 'next/image'
import Link from 'next/link'

import { getPostAuthorDisplayName } from '@/entities/post'
import { useI18n } from '@/shared/lib/i18n'
import { formatRelativePostTime } from '../lib/formatRelativePostTime'
import type { PublicPostCardModel } from '../model/types'
import styles from '../public-post-card.module.css'
import { PublicPostCarousel } from './PublicPostCarousel'
import { PublicPostDescription } from './PublicPostDescription'

type PublicPostCardProps = {
  post: PublicPostCardModel
}

export function PublicPostCard({ post }: PublicPostCardProps) {
  const { language, t } = useI18n()
  const authorName = getPostAuthorDisplayName(post.author, t.widgets.publicPostCard.unknownAuthor)
  const avatarFallback = authorName.charAt(0).toUpperCase()
  const postHref = `/posts/${post.id}`
  const authorHref = post.author ? `/profile/${post.author.id}` : null

  const authorContent = (
    <>
      <span
        aria-label={`${authorName} ${t.profile.avatarSuffix}`}
        className={styles.avatar}
        role="img"
      >
        {post.author?.avatar ? (
          <Image alt="" fill sizes="36px" src={post.author.avatar.url} unoptimized />
        ) : (
          <span aria-hidden>{avatarFallback}</span>
        )}
      </span>
      <span className={styles.authorName}>{authorName}</span>
    </>
  )

  return (
    <article className={styles.card} data-post-id={post.id}>
      <PublicPostCarousel media={post.media} postId={post.id} />

      {authorHref ? (
        <Link className={styles.authorLink} href={authorHref}>
          {authorContent}
        </Link>
      ) : (
        <div className={styles.authorLink}>{authorContent}</div>
      )}

      <Link className={styles.contentLink} href={postHref}>
        <time className={styles.createdAt} dateTime={post.createdAt}>
          {formatRelativePostTime(post.createdAt, undefined, language, {
            justNow: t.widgets.publicPostCard.justNow,
            recently: t.widgets.publicPostCard.recently,
          })}
        </time>
      </Link>
      <PublicPostDescription description={post.description} postHref={postHref} />
    </article>
  )
}
