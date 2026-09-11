import styles from './create-post-skeleton.module.css'

type CreatePostSkeletonProps = {
  description: string
  title: string
}

export function CreatePostSkeleton({ description, title }: CreatePostSkeletonProps) {
  return (
    <section className={styles.root} aria-label={title}>
      <div className={styles.preview} aria-hidden>
        <div className={styles.previewIcon} />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
    </section>
  )
}
