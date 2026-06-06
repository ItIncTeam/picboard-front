import { RoutePlaceholder } from '@/views/route-placeholder'

export function PublicHomePage() {
  return (
    <RoutePlaceholder
      title="Public landing"
      description="Public entry route placeholder for unauthenticated users."
      routes={['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password']}
    />
  )
}
