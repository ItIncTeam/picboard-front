import type { Post } from '@/entities/post'
import styles from './post.module.css'

type PostCardProps = {
  post?: Post
}

export function PostCard({ post }: PostCardProps) {
  const primaryImage = post?.images[0]

  return (
    <article className={styles.card}>
      <div className={styles.imageSlot}>
        {primaryImage ? (
          <div
            aria-label={primaryImage.alt}
            className={styles.image}
            role="img"
            style={{ backgroundImage: `url(${primaryImage.url})` }}
          />
        ) : (
          <span className={styles.placeholder}>Post image</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.author}>{post?.authorName ?? 'Post author'}</h3>
        <p className={styles.caption}>{post?.caption ?? 'Post card skeleton'}</p>
      </div>
    </article>
  )
}
