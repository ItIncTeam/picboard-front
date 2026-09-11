'use client'

import { useI18n } from '@/shared/lib/i18n'
import { RoutePlaceholder } from '@/views/route-placeholder'

export function MessengerPage() {
  const { t } = useI18n()

  return (
    <RoutePlaceholder
      title={t.routePlaceholder.messengerSection.title}
      description={t.routePlaceholder.messengerSection.description}
      figmaNode="1:12"
      routes={['/messenger', '/messenger/[dialogId]']}
    />
  )
}
