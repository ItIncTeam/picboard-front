import { RoutePlaceholder } from '@/views/route-placeholder'

export function MessengerPage() {
  return (
    <RoutePlaceholder
      title="Messenger"
      description="Protected messenger route with dialog list and conversation area."
      figmaNode="1:12"
      routes={['/[locale]/messenger', '/[locale]/messenger/[dialogId]']}
    />
  )
}
