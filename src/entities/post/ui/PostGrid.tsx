import type { Post } from '../model/postTypes'
import { PostCard } from './PostCard'
import styles from './post.module.css'

type PostGridProps = {
  posts?: Post[]
}

export function PostGrid({ posts = [] }: PostGridProps) {
  if (posts.length === 0) {
    return <p className={styles.empty}>Posts grid skeleton. Backend data is not connected yet.</p>
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
