import Image from 'next/image'

import type { Post } from '../model/postTypes'
import styles from './post.module.css'

type PostCardProps = {
  post?: Post
  showCaption?: boolean
}

export function PostCard({ post, showCaption = false }: PostCardProps) {
  const primaryImage = post?.images[0]

  return (
    <article className={styles.card}>
      <div className={styles.imageSlot}>
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
      </div>

      {showCaption && post?.caption && <p className={styles.caption}>{post.caption}</p>}
    </article>
  )
}
