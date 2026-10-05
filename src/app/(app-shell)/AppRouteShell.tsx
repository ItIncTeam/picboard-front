'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import { type ReactNode, useEffect, useRef } from 'react'

import { useSession } from '@/features/auth/session-management'
import { AdaptiveAppShell } from '@/widgets/adaptive-app-shell'

import styles from './app-route-shell.module.css'

type AppRouteShellProps = Readonly<{
  children: ReactNode
}>

export function AppRouteShell({ children }: AppRouteShellProps) {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const isBootstrapping = status === 'bootstrapping'
  const segments = useSelectedLayoutSegments().filter((segment) => !segment.startsWith('('))
  const routeIdentity = JSON.stringify(segments)
  const primarySegment = segments[0] ?? null
  const section =
    primarySegment && ['main', 'profile', 'favorites', 'settings'].includes(primarySegment)
      ? primarySegment
      : null
  const contentRef = useRef<HTMLDivElement>(null)
  const previousRouteRef = useRef<{ section: string | null; status: typeof status } | null>(null)

  useEffect(() => {
    const previousRoute = previousRouteRef.current
    previousRouteRef.current = { section, status }
    const content = contentRef.current

    if (
      !content ||
      status !== 'authenticated' ||
      previousRoute?.status !== 'authenticated' ||
      !previousRoute.section ||
      !section ||
      previousRoute.section === section ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Flush the removed animation class before restarting it on the same DOM node.
    void content.offsetWidth
    content.classList.add(styles.enter)

    return () => {
      content.classList.remove(styles.enter)
    }
  }, [routeIdentity, section, status])

  return (
    <AdaptiveAppShell authenticated={isAuthenticated} pending={isBootstrapping}>
      <div className={styles.page} ref={contentRef}>
        {children}
      </div>
    </AdaptiveAppShell>
  )
}
