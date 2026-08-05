import { PublicPostsGrid } from '@/widgets/public-posts-grid'
import { RegisteredUsersCounter } from '@/widgets/registered-users-counter'

import { getPublicHomeData } from './api/getPublicHomeData'
import type { PublicHomeDisplayModel } from './model/publicHomeModel'
import styles from './public-home-page.module.css'

export async function PublicHomePage() {
  const data = await getPublicHomeData()

  return <PublicHomeContent data={data} />
}

export function PublicHomeContent({ data }: { data: PublicHomeDisplayModel }) {
  return (
    <section className={styles.root} aria-labelledby="public-home-title">
      <h1 className={styles.visuallyHidden} id="public-home-title">
        Latest public posts
      </h1>
      <RegisteredUsersCounter usersCount={data.usersCount} />

      {data.posts.length > 0 ? (
        <PublicPostsGrid posts={data.posts} />
      ) : (
        <div className={styles.state} role="status">
          <h2 className={styles.stateTitle}>No public posts yet</h2>
          <p className={styles.stateDescription}>New posts will appear here.</p>
        </div>
      )}
    </section>
  )
}
