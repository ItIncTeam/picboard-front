import { RoutePlaceholder } from '@/views/route-placeholder'

export function MainPage() {
  return (
    <RoutePlaceholder
      title="Main"
      description="Authorized main page with registered users counter and public post cards."
      figmaNode="1:12"
      routes={['/main', '/feed']}
    />
  )
}
