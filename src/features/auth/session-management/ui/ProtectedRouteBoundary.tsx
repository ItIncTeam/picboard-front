'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { getSignInHrefWithReturnTo } from '@/shared/lib/auth'

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

  useEffect(() => {
    if (status === 'anonymous') {
      const returnTo = `${window.location.pathname}${window.location.search}`

      router.replace(getSignInHrefWithReturnTo(returnTo))
    }
  }, [router, status])

  if (status === 'bootstrapping') {
    return <SessionStatusScreen message="Loading session..." />
  }

  if (status === 'anonymous') {
    return <SessionStatusScreen message="Redirecting to sign in..." />
  }

  return children
}
