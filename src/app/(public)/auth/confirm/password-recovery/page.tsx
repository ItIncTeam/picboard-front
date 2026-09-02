import { Suspense } from 'react'

import { LoadingFallback } from '@/shared/ui/loading-fallback'
import { ConfirmPasswordRecoveryView } from '@/views/auth/confirm-password-recovery'

export default function ConfirmPasswordRecoveryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmPasswordRecoveryView />
    </Suspense>
  )
}
