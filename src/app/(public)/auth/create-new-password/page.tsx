import { Suspense } from 'react'

import { CreateNewPasswordPage } from '@/views/create-new-password-page'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateNewPasswordPage />
    </Suspense>
  )
}
