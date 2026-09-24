'use client'

import Image from 'next/image'
import Link from 'next/link'

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
  const authorName = post.author.displayName?.trim() || post.author.username
  const avatarFallback = authorName.charAt(0).toUpperCase()
  const { language, t } = useI18n()
  const postHref = `/posts/${post.id}`
  const authorHref = `/profile/${post.author.id}`

  return (
    <article className={styles.card} data-post-id={post.id}>
      <PublicPostCarousel media={post.media} postId={post.id} />

      <Link className={styles.authorLink} href={authorHref}>
        <span
          aria-label={`${authorName} ${t.profile.avatarSuffix}`}
          className={styles.avatar}
          role="img"
        >
          {post.author.avatar ? (
            <Image alt="" fill sizes="36px" src={post.author.avatar.url} unoptimized />
          ) : (
            <span aria-hidden>{avatarFallback}</span>
          )}
        </span>
        <span className={styles.authorName}>{authorName}</span>
      </Link>

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
