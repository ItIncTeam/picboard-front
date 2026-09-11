import { PublicPostCard, type PublicPostCardModel } from '@/widgets/public-post-card'

import styles from './public-posts-grid.module.css'

type PublicPostsGridProps = {
  posts: PublicPostCardModel[]
}

export function PublicPostsGrid({ posts }: PublicPostsGridProps) {
  return (
    <div className={styles.grid} data-testid="public-posts-grid">
      {posts.map((post) => (
        <PublicPostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
