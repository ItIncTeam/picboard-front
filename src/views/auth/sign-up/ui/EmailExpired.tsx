'use client'

import Image from 'next/image'
import { type SyntheticEvent, useState } from 'react'

import { emailConfirmationResending } from '@/features/auth/confirm-registration'
import { ExpiredSignUpImage } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import layoutStyles from './sign-up-state-layout.module.css'
import styles from './email-expired.module.css'

type EmailExpiredProps = {
  email?: string
}

const fallbackErrorMessage = 'Verification link resending failed. Please try again.'

const getErrorMessage = (error: unknown) => {
  return error instanceof Error && error.message.length > 0 ? error.message : fallbackErrorMessage
}

export function EmailExpired({ email }: EmailExpiredProps) {
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
      setSuccessMessage('Verification link has been sent')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthViewShell>
      <section className={layoutStyles.root}>
        <div className={layoutStyles.content}>
          <div className={layoutStyles.header}>
            <Title level="h1">Email verification link expired</Title>

            <Text>
              Looks like the verification link has expired. Not to worry, we can send the link again
            </Text>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputField}>
              <Input
                autoComplete="email"
                disabled={isLoading}
                error={error}
                label="Email"
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
              loadingText="Sending..."
              type="submit"
            >
              Resend verification link
            </Button>
          </form>
        </div>

        <Image
          alt="Verification link expired illustration"
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
