'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'

import { OAuthProviders, SignUpForm } from '@/features/auth'
import { EmailSentModal } from '@/features/auth/sign-up-form/ui'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { authRoutes } from '@/shared/lib/auth'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'
import { DocModal, type DocModalKind } from '@/widgets/doc-modal'
import { useI18n } from '@/shared/lib/i18n'

import { selectSignUpMode } from './model/selectMode'
import styles from './sign-up-view.module.css'
import { EmailExpired, RegistrationConfirmed } from './ui'

function SignUpViewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = selectSignUpMode(searchParams)
  const [isEmailSentOpen, setIsEmailSentOpen] = useState(false)
  const [openDoc, setOpenDoc] = useState<DocModalKind | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const { t } = useI18n()

  const handleCloseDoc = useCallback(() => {
    setOpenDoc(null)
  }, [])

  const handleCloseEmailSent = useCallback(() => {
    setIsEmailSentOpen(false)
    router.push(authRoutes.signIn)
  }, [router])

  const handleOpenPrivacy = useCallback(() => {
    setOpenDoc('privacy')
  }, [])

  const handleOpenTerms = useCallback(() => {
    setOpenDoc('terms')
  }, [])

  const handleSuccess = useCallback((email: string) => {
    setSubmittedEmail(email)
    setIsEmailSentOpen(true)
  }, [])

  if (mode === 'confirmed') {
    return <RegistrationConfirmed />
  }

  if (mode === 'expired') {
    return <EmailExpired email={searchParams.get('email') ?? undefined} />
  }

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          {t.auth.signUp.title}
        </Title>
        <div className={styles.cardBody}>
          <OAuthProviders intent="signUp" />
          <SignUpForm
            onOpenPrivacyAction={handleOpenPrivacy}
            onOpenTermsAction={handleOpenTerms}
            onSuccessAction={handleSuccess}
          />
        </div>
      </AuthFormCard>
      {isEmailSentOpen && (
        <EmailSentModal
          email={submittedEmail}
          open={isEmailSentOpen}
          onCloseAction={handleCloseEmailSent}
        />
      )}
      {openDoc !== null && <DocModal kind={openDoc} onCloseAction={handleCloseDoc} />}
    </AuthViewShell>
  )
}

export function SignUpView() {
  return (
    <Suspense fallback={null}>
      <SignUpViewContent />
    </Suspense>
  )
}
