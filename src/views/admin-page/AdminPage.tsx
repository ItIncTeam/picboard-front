'use client'

import { useI18n } from '@/shared/lib/i18n'
import { RoutePlaceholder } from '@/views/route-placeholder'

type AdminScreen = 'payments' | 'posts' | 'statistics'

type AdminPageProps = {
  screen: AdminScreen
}

export function AdminPage({ screen }: AdminPageProps) {
  const { t } = useI18n()
  const adminScreenTitles: Record<AdminScreen, string> = {
    payments: t.routePlaceholder.adminSections.payments,
    posts: t.routePlaceholder.adminSections.posts,
    statistics: t.routePlaceholder.adminSections.statistics,
  }

  return (
    <RoutePlaceholder
      title={adminScreenTitles[screen]}
      description={t.routePlaceholder.adminSections.description}
      figmaNode="376:8092"
      routes={['/admin/users', '/admin/statistics', '/admin/payments', '/admin/posts']}
    />
  )
}
