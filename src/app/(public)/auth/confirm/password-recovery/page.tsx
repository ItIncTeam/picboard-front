import { Suspense } from 'react'

import { ConfirmPasswordRecoveryView } from '@/views/auth/confirm-password-recovery'

export default function ConfirmPasswordRecoveryPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPasswordRecoveryView />
    </Suspense>
  )
}
