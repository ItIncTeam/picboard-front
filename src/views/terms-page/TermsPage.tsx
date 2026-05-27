import { RoutePlaceholder } from '@/views/route-placeholder'

export function TermsPage() {
  return (
    <RoutePlaceholder
      title="Terms of Service"
      description="Static public route placeholder."
      routes={['/terms', '/privacy-policy']}
    />
  )
}
