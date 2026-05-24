import { RoutePlaceholder } from '@/views/route-placeholder'

export function FeedPage() {
  return (
    <RoutePlaceholder
      title="Feed"
      description="Protected social feed route from the WebApp / UI Figma section."
      figmaNode="1:12"
      routes={['/[locale]/feed', '/[locale]/posts/[postId]', '/[locale]/posts/create']}
    />
  )
}
