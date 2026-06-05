'use client'

import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

import { OAuthProviders, SignInForm } from '@/features/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './sign-in-view.module.css'

function SignInViewContent() {
  const router = useRouter()

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          Sign In
        </Title>
        <div className={styles.cardBody}>
          <OAuthProviders intent="signIn" />
          <SignInForm
            onSuccess={() => {
              router.push('/main')
            }}
          />
        </div>
      </AuthFormCard>
    </AuthViewShell>
  )
}

export function SignInView() {
  return (
    <Suspense fallback={null}>
      <SignInViewContent />
    </Suspense>
  )
}
