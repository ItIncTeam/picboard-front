'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { OAuthProviders, SignInForm } from '@/features/auth'
import { getSafeReturnToPath } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './sign-in-view.module.css'

function SignInViewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = getSafeReturnToPath(searchParams.get('returnTo'))
  const { t } = useI18n()

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          {t.auth.signIn.title}
        </Title>
        <div className={styles.cardBody}>
          <OAuthProviders intent="signIn" />
          <SignInForm
            onSuccessAction={() => {
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
