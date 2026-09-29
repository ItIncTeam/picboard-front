'use client'

import { useI18n } from '@/shared/lib/i18n'
import { RoutePlaceholder } from '@/views/route-placeholder'

export function FeedPage() {
  const { t } = useI18n()

  return (
    <RoutePlaceholder
      title={t.routePlaceholder.feedSection.title}
      description={t.routePlaceholder.feedSection.description}
      figmaNode="1:12"
      routes={['/feed', '/posts/[postId]', '/posts/create']}
    />
  )
}
