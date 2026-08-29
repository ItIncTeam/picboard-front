import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/entities/post'
import styles from './post.module.css'

type PostCardProps = {
  post?: Post
  returnTo?: string
  showCaption?: boolean
}

function getPostDetailsHref(postId: string, returnTo?: string): string {
  if (!returnTo) {
    return `/posts/${postId}`
  }

  return `/posts/${postId}?${new URLSearchParams({ returnTo }).toString()}`
}

export function PostCard({ post, returnTo, showCaption = false }: PostCardProps) {
  const primaryImage = post?.images[0]

  return (
    <article className={styles.card}>
      <div className={styles.imageSlot}>
        {post ? (
          <Link
            aria-label={`View post ${post.id}`}
            className={styles.postLink}
            href={getPostDetailsHref(post.id, returnTo)}
          >
            {primaryImage ? (
              <Image
                alt={primaryImage.alt}
                className={styles.postImage}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                src={primaryImage.url}
                unoptimized
              />
            ) : (
              <span className={styles.placeholder}>Post image</span>
            )}
          </Link>
        ) : (
          <span className={styles.placeholder}>Post image</span>
        )}
      </div>

      {showCaption && post?.caption && <p className={styles.caption}>{post.caption}</p>}
    </article>
  )
}
