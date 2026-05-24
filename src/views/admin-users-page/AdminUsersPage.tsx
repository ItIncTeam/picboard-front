import { RoutePlaceholder } from '@/views/route-placeholder'

export function AdminUsersPage() {
  return (
    <RoutePlaceholder
      title="Admin users"
      description="SuperAdmin users list route with search, filtering, table actions, and pagination."
      figmaNode="376:8092"
      routes={['/[locale]/admin/users']}
    />
  )
}
