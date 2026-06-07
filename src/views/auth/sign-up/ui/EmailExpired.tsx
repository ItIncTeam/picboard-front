'use client'

import NextLink from 'next/link'
import { type SyntheticEvent, useState } from 'react'

import { emailConfirmationResending } from '@/features/auth/confirm-registration'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { authRoutes } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

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
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          Email verification link expired
        </Title>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Text className={styles.description}>
            Looks like the verification link has expired. Not to worry, we can send the link again
          </Text>

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
            type="email"
            value={emailValue}
          />

          {successMessage && (
            <Text aria-live="polite" className={styles.success} role="status" size="sm">
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

          <Button asChild className={styles.signInButton} type="button" variant="textButton">
            <NextLink href={authRoutes.signIn}>Sign In</NextLink>
          </Button>
        </form>
      </AuthFormCard>
    </AuthViewShell>
  )
}
