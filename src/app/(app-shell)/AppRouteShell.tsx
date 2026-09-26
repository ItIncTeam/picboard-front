'use client'

import { type ReactNode } from 'react'

import { useSession } from '@/features/auth/session-management'
import { AdaptiveAppShell } from '@/widgets/adaptive-app-shell'

type AppRouteShellProps = Readonly<{
  children: ReactNode
}>

export function AppRouteShell({ children }: AppRouteShellProps) {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const isBootstrapping = status === 'bootstrapping'

  return (
    <AdaptiveAppShell authenticated={isAuthenticated} pending={isBootstrapping}>
      {children}
    </AdaptiveAppShell>
  )
}
