'use client'

import Image from 'next/image'
import { type SyntheticEvent, useState } from 'react'

import { emailConfirmationResending } from '@/features/auth/confirm-registration'
import { ExpiredSignUpImage } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import layoutStyles from './sign-up-state-layout.module.css'
import styles from './email-expired.module.css'

type EmailExpiredProps = {
  email?: string
}

const getErrorMessage = (error: unknown, fallbackErrorMessage: string) => {
  return error instanceof Error && error.message.length > 0 ? error.message : fallbackErrorMessage
}

export function EmailExpired({ email }: EmailExpiredProps) {
  const { t } = useI18n()
  const [emailValue, setEmailValue] = useState(email ?? '')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const trimmedEmail = emailValue.trim()
  const canSubmit = trimmedEmail.length > 0 && !isLoading

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      await emailConfirmationResending({ email: trimmedEmail })
      setSuccessMessage(t.auth.signUp.resendVerificationSuccess)
    } catch (submitError) {
      setError(getErrorMessage(submitError, t.auth.signUp.resendVerificationFallbackError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthViewShell>
      <section className={layoutStyles.root}>
        <div className={layoutStyles.content}>
          <div className={layoutStyles.header}>
            <Title level="h1">{t.auth.signUp.verificationExpiredTitle}</Title>

            <Text>{t.auth.signUp.verificationExpiredDescription}</Text>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputField}>
              <Input
                autoComplete="email"
                disabled={isLoading}
                error={error}
                label={t.auth.signUp.email}
                onChange={(event) => {
                  setEmailValue(event.target.value)
                  setError('')
                  setSuccessMessage('')
                }}
                placeholder="Epam@epam.com"
                type="email"
                value={emailValue}
              />
            </div>

            {successMessage && (
              <Text aria-live="polite" color="var(--color-status-success)" role="status" size="sm">
                {successMessage}
              </Text>
            )}

            <Button
              className={styles.submitButton}
              disabled={!canSubmit}
              loading={isLoading}
              loadingText={t.auth.signUp.resendingVerificationLink}
              type="submit"
            >
              {t.auth.signUp.resendVerificationLink}
            </Button>
          </form>
        </div>

        <Image
          alt={t.auth.signUp.verificationExpiredAlt}
          className={styles.illustration}
          height={352}
          sizes="474px"
          src={ExpiredSignUpImage}
          width={474}
        />
      </section>
    </AuthViewShell>
  )
}
