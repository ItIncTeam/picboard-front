'use client'

import { useSession } from '@/features/auth/session-management'
import { AdaptiveAppShell } from '@/widgets/adaptive-app-shell'

type ProfileRouteShellProps = Readonly<{
  children: React.ReactNode
}>

export function ProfileRouteShell({ children }: ProfileRouteShellProps) {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const isBootstrapping = status === 'bootstrapping'

  return (
    <AdaptiveAppShell authenticated={isAuthenticated} pending={isBootstrapping}>
      {children}
    </AdaptiveAppShell>
  )
}
