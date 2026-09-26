import { Suspense } from 'react'

import { LoadingFallback } from '@/shared/ui/loading-fallback'
import { CreateNewPasswordPage } from '@/views/create-new-password-page'

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateNewPasswordPage />
    </Suspense>
  )
}
