'use client'

import { Button } from '@/shared/ui/button'
import { useI18n } from '@/shared/lib/i18n'

import styles from '@/app/(app-shell)/(public-home)/error.module.css'

type ProfileRouteErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function ProfileRouteError({ unstable_retry: retry }: ProfileRouteErrorProps) {
  const { t } = useI18n()

  return (
    <section className={styles.root} aria-labelledby="profile-route-error-title">
      <h1 className={styles.title} id="profile-route-error-title">
        {t.profile.title}
      </h1>
      <p className={styles.description}>{t.profile.loadingError}</p>
      <Button onClick={retry} type="button" variant="outlined">
        {t.createPost.actions.retry}
      </Button>
    </section>
  )
}
