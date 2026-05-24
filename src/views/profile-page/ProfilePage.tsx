import { RoutePlaceholder } from '@/views/route-placeholder'

export function ProfilePage() {
  return (
    <RoutePlaceholder
      title="Profile"
      description="Protected user profile route with profile header, counters, and publication grid."
      figmaNode="1:12"
      routes={[
        '/[locale]/profile/[userId]',
        '/[locale]/profile/followers',
        '/[locale]/profile/subscriptions',
      ]}
    />
  )
}
