'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { OAuthProviders, SignUpForm } from '@/features/auth'
import { AuthCard } from '@/shared/ui/auth-card'
import { Title } from '@/shared/ui/typography'
import { ViewShell } from '@/widgets/view-shell'

import { selectSignUpMode } from './model/selectMode'
import styles from './sign-up-view.module.css'

function SignUpViewContent() {
  const searchParams = useSearchParams()
  const mode = selectSignUpMode(searchParams)
  const [isEmailSentOpen, setIsEmailSentOpen] = useState(false)

  return (
    <ViewShell>
      {mode === 'form' && (
        <AuthCard>
          <Title level="h1" className={styles.cardTitleCenter}>
            Sign Up
          </Title>
          <div className={styles.cardBody}>
            <OAuthProviders intent="signUp" />
            <SignUpForm onSuccess={() => setIsEmailSentOpen(true)} />
          </div>
        </AuthCard>
      )}
      {mode === 'confirmed' && <p>SignUpConfirmedState</p>}
      {mode === 'expired' && <p>SignUpExpiredState</p>}
      {isEmailSentOpen && <p>Email sent modal</p>}
    </ViewShell>
  )
}

export function SignUpView() {
  return (
    <Suspense fallback={null}>
      <SignUpViewContent />
    </Suspense>
  )
}
