import { RoutePlaceholder } from '@/views/route-placeholder'

type AdminScreen = 'payments' | 'posts' | 'statistics'

const adminScreenTitles: Record<AdminScreen, string> = {
  payments: 'Admin payments',
  posts: 'Admin posts',
  statistics: 'Admin statistics',
}

type AdminPageProps = {
  screen: AdminScreen
}

export function AdminPage({ screen }: AdminPageProps) {
  return (
    <RoutePlaceholder
      title={adminScreenTitles[screen]}
      description="Protected SuperAdmin workspace route from the WebApp / UI / SuperAdmin Figma section."
      figmaNode="376:8092"
      routes={['/admin/users', '/admin/statistics', '/admin/payments', '/admin/posts']}
    />
  )
}
