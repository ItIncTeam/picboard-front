import styles from './public-home-page.module.css'

export type PublicHomePost = {
  authorAvatarUrl: string
  authorName: string
  caption: string
  createdAtLabel: string
  id: string
  imageAlt: string
  imageUrl: string
}

type PublicHomePageProps = {
  posts: PublicHomePost[]
  usersCount: number
}

const counterDigitCount = 6

function formatUsersCount(usersCount: number): string[] {
  return String(Math.max(0, usersCount)).padStart(counterDigitCount, '0').split('')
}

export function PublicHomePage({ posts, usersCount }: PublicHomePageProps) {
  const userCountDigits = formatUsersCount(usersCount)

  return (
    <section className={styles.root} aria-labelledby="public-home-title">
      <h1 className={styles.title} id="public-home-title">
        Latest public posts
      </h1>

      <div className={styles.usersCounter} aria-label={`${usersCount} registered users`}>
        <span className={styles.counterLabel}>Registered users:</span>
        <span className={styles.counterDigits} aria-hidden>
          {userCountDigits.map((digit, index) => {
            return (
              <span className={styles.counterDigit} key={`${digit}-${index}`}>
                {digit}
              </span>
            )
          })}
        </span>
      </div>

      <div className={styles.postsGrid}>
        {posts.slice(0, 4).map((post) => {
          return <PublicPostCard key={post.id} post={post} />
        })}
      </div>
    </section>
  )
}

function PublicPostCard({ post }: { post: PublicHomePost }) {
  return (
    <article className={styles.postCard}>
      <div
        aria-label={post.imageAlt}
        className={styles.postImage}
        role="img"
        style={{ backgroundImage: `url(${post.imageUrl})` }}
      />

      <div className={styles.postAuthor}>
        <span aria-hidden className={styles.authorAvatar} data-empty={!post.authorAvatarUrl}>
          {post.authorAvatarUrl ? (
            <span
              className={styles.authorAvatarImage}
              style={{ backgroundImage: `url(${post.authorAvatarUrl})` }}
            />
          ) : null}
        </span>
        <span className={styles.authorName}>{post.authorName}</span>
      </div>

      <time className={styles.createdAt}>{post.createdAtLabel}</time>

      <p className={styles.caption}>
        {post.caption}
        <button className={styles.showMoreButton} type="button">
          Show more
        </button>
      </p>
    </article>
  )
}
