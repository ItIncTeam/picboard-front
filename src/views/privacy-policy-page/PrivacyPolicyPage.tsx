import { RoutePlaceholder } from '@/views/route-placeholder'

export function PrivacyPolicyPage() {
  return (
    <RoutePlaceholder
      title="Privacy Policy"
      description="Static public route placeholder."
      routes={['/privacy-policy', '/terms']}
    />
  )
}
