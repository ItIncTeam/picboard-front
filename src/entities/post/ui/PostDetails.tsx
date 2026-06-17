import type { Post } from '../model/postTypes'
import { PostCard } from './PostCard'
import styles from './post.module.css'

type PostDetailsProps = {
  post?: Post
}

export function PostDetails({ post }: PostDetailsProps) {
  return (
    <section className={styles.details} aria-label="Post details">
      <PostCard post={post} />

      <div className={styles.detailsBody}>
        <h2 className={styles.detailsTitle}>Post details</h2>
        <p className={styles.caption}>
          {post?.caption ?? 'Details skeleton. getPostById is blocked by backend contract.'}
        </p>
        {post?.createdAtLabel && <p className={styles.meta}>{post.createdAtLabel}</p>}
      </div>
    </section>
  )
}
