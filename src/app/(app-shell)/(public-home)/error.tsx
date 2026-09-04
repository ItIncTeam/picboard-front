'use client'

import { Button } from '@/shared/ui/button'
import { useI18n } from '@/shared/lib/i18n'

import styles from './error.module.css'

type PublicRouteErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function PublicRouteError({ unstable_retry: reset }: PublicRouteErrorProps) {
  const { t } = useI18n()

  return (
    <section className={styles.root} aria-labelledby="public-route-error-title">
      <h1 className={styles.title} id="public-route-error-title">
        {t.appError.title}
      </h1>
      <p className={styles.description}>{t.appError.description}</p>
      <Button onClick={reset} type="button" variant="outlined">
        {t.appError.action}
      </Button>
    </section>
  )
}
