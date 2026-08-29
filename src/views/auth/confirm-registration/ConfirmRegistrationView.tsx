'use client'

import NextLink from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

import {
  emailConfirmation,
  resolveEmailConfirmationOutcome,
} from '@/features/auth/confirm-registration'
import { getSignUpConfirmedHref, getSignUpExpiredHref } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './confirm-registration-view.module.css'

function ConfirmRegistrationViewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const code = useMemo(() => searchParams.get('code')?.trim() ?? '', [searchParams])
  const confirmedCodeRef = useRef<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      router.replace(getSignUpExpiredHref())
      return
    }

    if (confirmedCodeRef.current === code) {
      return
    }

    confirmedCodeRef.current = code
    let isActive = true

    setErrorMessage(null)

    void emailConfirmation({ code })
      .then(() => {
        if (!isActive) {
          return
        }

        router.replace(getSignUpConfirmedHref())
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        const outcome = resolveEmailConfirmationOutcome(error)

        if (outcome.kind === 'confirmed') {
          router.replace(getSignUpConfirmedHref())
          return
        }

        if (outcome.kind === 'expired') {
          router.replace(getSignUpExpiredHref())
          return
        }

        setErrorMessage(outcome.message)
      })

    return () => {
      isActive = false
    }
  }, [code, router])

  if (errorMessage) {
    return (
      <AuthViewShell>
        <AuthFormCard>
          <Title level="h1" className={styles.title}>
            {t.auth.confirmRegistration.title}
          </Title>

          <div className={styles.content}>
            <Text aria-live="polite" className={styles.message} color="var(--color-status-danger)">
              {errorMessage}
            </Text>

            <Button asChild className={styles.action}>
              <NextLink href={getSignUpExpiredHref()}>
                {t.auth.confirmRegistration.requestNewLink}
              </NextLink>
            </Button>
          </div>
        </AuthFormCard>
      </AuthViewShell>
    )
  }

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          {t.auth.confirmRegistration.title}
        </Title>

        <div className={styles.content}>
          <Text aria-live="polite" className={styles.message}>
            {t.auth.confirmRegistration.loading}
          </Text>
        </div>
      </AuthFormCard>
    </AuthViewShell>
  )
}

export function ConfirmRegistrationView() {
  return (
    <Suspense fallback={null}>
      <ConfirmRegistrationViewContent />
    </Suspense>
  )
}
