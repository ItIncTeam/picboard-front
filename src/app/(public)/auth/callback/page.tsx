import { Suspense } from 'react'

import { OAuthCallbackView } from '@/views/auth/oauth-callback'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackView />
    </Suspense>
  )
}
