'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { OAuthProviders, SignInForm } from '@/features/auth'
import { getSafeReturnToPath } from '@/shared/lib/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './sign-in-view.module.css'

function SignInViewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = getSafeReturnToPath(searchParams.get('returnTo'))

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
              router.push(returnTo)
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
