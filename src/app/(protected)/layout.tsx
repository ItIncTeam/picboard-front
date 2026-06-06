import { ProtectedRouteBoundary } from '@/features/auth/session-management'

type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <ProtectedRouteBoundary>{children}</ProtectedRouteBoundary>
}
