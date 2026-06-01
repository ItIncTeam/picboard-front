'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { SignUpForm } from '@/features/auth'
import { AuthCard } from '@/shared/ui/auth-card'
import { Title } from '@/shared/ui/typography'
import { PublicAuthLayout } from '@/widgets/public-auth-layout'

import { selectSignUpMode } from './model/selectMode'
import styles from './sign-up-view.module.css'

function SignUpViewContent() {
  const searchParams = useSearchParams()
  const mode = selectSignUpMode(searchParams)
  const [isEmailSentOpen, setIsEmailSentOpen] = useState(false)

  return (
    <PublicAuthLayout>
      {mode === 'form' && (
        <AuthCard className={styles.formState}>
          <Title level="h1" className={styles.cardTitleCenter}>
            Sign Up
          </Title>
          <SignUpForm onSuccess={() => setIsEmailSentOpen(true)} />
        </AuthCard>
      )}
      {mode === 'confirmed' && <p>SignUpConfirmedState</p>}
      {mode === 'expired' && <p>SignUpExpiredState</p>}
      {isEmailSentOpen && <p>Email sent modal</p>}
    </PublicAuthLayout>
  )
}

export function SignUpView() {
  return (
    <Suspense fallback={null}>
      <SignUpViewContent />
    </Suspense>
  )
}
