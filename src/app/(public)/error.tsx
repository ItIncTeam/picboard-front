'use client'

import { Button } from '@/shared/ui/button'

import styles from './error.module.css'

type PublicRouteErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function PublicRouteError({ unstable_retry: reset }: PublicRouteErrorProps) {
  return (
    <section className={styles.root} aria-labelledby="public-route-error-title">
      <h1 className={styles.title} id="public-route-error-title">
        Public posts are unavailable
      </h1>
      <p className={styles.description}>Please try loading the page again.</p>
      <Button onClick={reset} type="button" variant="outlined">
        Try again
      </Button>
    </section>
  )
}
