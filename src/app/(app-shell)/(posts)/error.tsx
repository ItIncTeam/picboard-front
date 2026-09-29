'use client'

import { Button } from '@/shared/ui/button'
import { useI18n } from '@/shared/lib/i18n'

import styles from './error.module.css'

type PostRouteErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function PostRouteError({ unstable_retry: reset }: PostRouteErrorProps) {
  const { t } = useI18n()

  return (
    <section className={styles.root} aria-labelledby="post-route-error-title">
      <h1 className={styles.title} id="post-route-error-title">
        {t.appError.title}
      </h1>
      <p className={styles.description}>{t.appError.description}</p>
      <Button onClick={reset} type="button" variant="outlined">
        {t.appError.action}
      </Button>
    </section>
  )
}
