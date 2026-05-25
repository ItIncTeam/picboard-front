import { RoutePlaceholder } from '@/views/route-placeholder'

export default function Page() {
  return (
    <RoutePlaceholder
      title="Public landing"
      description="Public entry route placeholder for unauthenticated users."
      routes={[
        '/[locale]/auth/sign-in',
        '/[locale]/auth/sign-up',
        '/[locale]/auth/forgot-password',
        '/[locale]/auth/privacy-policy',
        '/[locale]/auth/terms',
      ]}
    />
  )
}
