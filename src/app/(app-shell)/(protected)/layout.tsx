import { ProtectedRouteBoundary } from '@/features/auth/session-management'

type ProtectedAppLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function ProtectedAppLayout({ children }: ProtectedAppLayoutProps) {
  return <ProtectedRouteBoundary>{children}</ProtectedRouteBoundary>
}
