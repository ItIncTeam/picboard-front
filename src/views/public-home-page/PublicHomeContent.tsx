'use client'

import { useI18n } from '@/shared/lib/i18n'
import { PublicPostsGrid } from '@/widgets/public-posts-grid'
import { RegisteredUsersCounter } from '@/widgets/registered-users-counter'

import type { PublicHomeDisplayModel } from './model/publicHomeModel'
import styles from './public-home-page.module.css'

export function PublicHomeContent({ data }: { data: PublicHomeDisplayModel }) {
  const { t } = useI18n()

  return (
    <section className={styles.root} aria-labelledby="public-home-title">
      <h1 className={styles.visuallyHidden} id="public-home-title">
        {t.publicHome.title}
      </h1>
      <RegisteredUsersCounter usersCount={data.usersCount} />

      {data.posts.length > 0 ? (
        <PublicPostsGrid posts={data.posts} />
      ) : (
        <div className={styles.state} role="status">
          <h2 className={styles.stateTitle}>{t.publicHome.emptyTitle}</h2>
          <p className={styles.stateDescription}>{t.publicHome.emptyDescription}</p>
        </div>
      )}
    </section>
  )
}
