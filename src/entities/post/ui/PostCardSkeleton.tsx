import styles from './post.module.css'

export function PostCardSkeleton() {
  return (
    <div aria-hidden className={styles.cardSkeleton}>
      <div className={styles.imageSkeleton} />
    </div>
  )
}
