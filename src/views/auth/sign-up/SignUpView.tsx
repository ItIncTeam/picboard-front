'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'

import { OAuthProviders, SignUpForm } from '@/features/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'
import { DocModal, type DocModalKind } from '@/widgets/doc-modal'

import { selectSignUpMode } from './model/selectMode'
import styles from './sign-up-view.module.css'

function SignUpViewContent() {
  const searchParams = useSearchParams()
  const mode = selectSignUpMode(searchParams)
  const [isEmailSentOpen, setIsEmailSentOpen] = useState(false)
  const [openDoc, setOpenDoc] = useState<DocModalKind | null>(null)

  const handleCloseDoc = useCallback(() => {
    setOpenDoc(null)
  }, [])

  const handleOpenPrivacy = useCallback(() => {
    setOpenDoc('privacy')
  }, [])

  const handleOpenTerms = useCallback(() => {
    setOpenDoc('terms')
  }, [])

  return (
    <AuthViewShell>
      {mode === 'form' && (
        <AuthFormCard>
          <Title level="h1" className={styles.cardTitleCenter}>
            Sign Up
          </Title>
          <div className={styles.cardBody}>
            <OAuthProviders intent="signUp" />
            <SignUpForm
              onOpenPrivacy={handleOpenPrivacy}
              onOpenTerms={handleOpenTerms}
              onSuccess={() => setIsEmailSentOpen(true)}
            />
          </div>
        </AuthFormCard>
      )}
      {mode === 'confirmed' && <p>SignUpConfirmedState</p>}
      {mode === 'expired' && <p>SignUpExpiredState</p>}
      {isEmailSentOpen && <p>Email sent modal</p>}
      {openDoc !== null && <DocModal kind={openDoc} onClose={handleCloseDoc} />}
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
