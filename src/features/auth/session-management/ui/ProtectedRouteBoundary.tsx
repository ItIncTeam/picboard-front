'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { getSignInHrefWithReturnTo } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'

import { useSession } from '../model/useSession'
import styles from './protected-route-boundary.module.css'

type ProtectedRouteBoundaryProps = Readonly<{
  children: ReactNode
}>

function SessionStatusScreen({ message }: { message: string }) {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <p className={styles.message}>{message}</p>
    </div>
  )
}

export function ProtectedRouteBoundary({ children }: ProtectedRouteBoundaryProps) {
  const { status } = useSession()
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    if (status === 'anonymous') {
      const returnTo = `${window.location.pathname}${window.location.search}`

      router.replace(getSignInHrefWithReturnTo(returnTo))
    }
  }, [router, status])

  if (status === 'bootstrapping') {
    return <SessionStatusScreen message={t.auth.session.loading} />
  }

  if (status === 'anonymous') {
    return <SessionStatusScreen message={t.auth.session.redirectingToSignIn} />
  }

  return children
}
