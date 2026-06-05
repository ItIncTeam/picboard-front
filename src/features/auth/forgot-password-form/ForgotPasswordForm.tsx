'use client'

import NextLink from 'next/link'
import { type SyntheticEvent, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Recaptcha } from '@/shared/ui/recaptcha'
import { Text } from '@/shared/ui/typography'

import { passwordReset } from './api'
import styles from './forgot-password-form.module.css'

const RECAPTCHA_ACTION = 'password_reset'

const MESSAGES = {
  description: 'Enter your email address and we will send you further instructions',
  recaptchaUnavailable: 'reCAPTCHA is not ready. Please try again.',
  successHint: "If you don't receive an email send link again",
  successTitle: 'The link has been sent by email.',
  userNotFound: "User with this email doesn't exist",
}

const isEmailValid = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function ForgotPasswordForm() {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isRecaptchaChecked, setIsRecaptchaChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successEmail, setSuccessEmail] = useState('')

  const trimmedEmail = email.trim()
  const hasSuccess = Boolean(successEmail)
  const isEmailReady = isEmailValid(trimmedEmail)
  const canSubmit = isEmailReady && (hasSuccess || isRecaptchaChecked) && !isLoading
  const recoveryButtonText = hasSuccess ? 'Send Link Again' : 'Send Link'

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      if (!executeRecaptcha) {
        throw new Error(MESSAGES.recaptchaUnavailable)
      }

      const captchaToken = await executeRecaptcha(RECAPTCHA_ACTION)

      await passwordReset({ captchaToken, email: trimmedEmail })
      setSuccessEmail(trimmedEmail)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : MESSAGES.userNotFound)
      setSuccessEmail('')
      setIsRecaptchaChecked(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div role="status" aria-live="polite">
        <Input
          autoComplete="email"
          disabled={isLoading}
          error={error}
          label="Email"
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
            setSuccessEmail('')
          }}
          placeholder="Epam@epam.com"
          type="email"
          value={email}
        />
      </div>

      <Text className={styles.description} size="sm">
        {MESSAGES.description}
      </Text>

      {successEmail && (
        <div className={styles.success} role="status" aria-live="polite">
          <Text size="sm">{MESSAGES.successTitle}</Text>
          <Text size="sm">{MESSAGES.successHint}</Text>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          className={styles.submitButton}
          type="submit"
          disabled={!canSubmit}
          loading={isLoading}
          loadingText="Sending..."
        >
          {recoveryButtonText}
        </Button>
        <Button asChild className={styles.backButton} type="button" variant="textButton">
          <NextLink href="/auth/sign-in">Back to Sign in</NextLink>
        </Button>
      </div>

      {!hasSuccess && (
        <Recaptcha
          className={styles.recaptcha}
          checked={isRecaptchaChecked}
          disabled={isLoading}
          onCheckedChange={(checked) => {
            setIsRecaptchaChecked(checked)
            setSuccessEmail('')
          }}
        />
      )}
    </form>
  )
}
