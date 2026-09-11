'use client'

import { useI18n } from '@/shared/lib/i18n'
import { RoutePlaceholder } from '@/views/route-placeholder'

export function AdminUsersPage() {
  const { t } = useI18n()

  return (
    <RoutePlaceholder
      title={t.routePlaceholder.adminSections.users}
      description={t.routePlaceholder.adminSections.usersDescription}
      figmaNode="376:8092"
      routes={['/admin/users']}
    />
  )
}
