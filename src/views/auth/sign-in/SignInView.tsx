'use client'

import { Suspense } from 'react'

import { OAuthProviders, SignInForm } from '@/features/auth'
import { AuthCard } from '@/shared/ui/auth-card'
import { Title } from '@/shared/ui/typography'
import { ViewShell } from '@/widgets/view-shell'

import styles from './sign-in-view.module.css'

function SignInViewContent() {
  return (
    <ViewShell>
      <AuthCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          Sign In
        </Title>
        <div className={styles.cardBody}>
          <OAuthProviders intent="signIn" />
          <SignInForm />
        </div>
      </AuthCard>
    </ViewShell>
  )
}

export function SignInView() {
  return (
    <Suspense fallback={null}>
      <SignInViewContent />
    </Suspense>
  )
}
