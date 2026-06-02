'use client'

import NextLink from 'next/link'
import { type SyntheticEvent, useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Recaptcha } from '@/shared/ui/recaptcha'
import { Text } from '@/shared/ui/typography'

import { sendPasswordRecoveryLink } from './api'
import styles from './forgot-password-form.module.css'

const MESSAGES = {
  description: 'Enter your email address and we will send you further instructions',
  successHint: "If you don't receive an email send link again",
  successTitle: 'The link has been sent by email.',
  userNotFound: "User with this email doesn't exist",
}

const isEmailValid = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isRecaptchaChecked, setIsRecaptchaChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successEmail, setSuccessEmail] = useState('')

  const trimmedEmail = email.trim()
  const hasSuccess = Boolean(successEmail)
  const isEmailReady = isEmailValid(trimmedEmail)
  const canSubmit = isEmailReady && (hasSuccess || isRecaptchaChecked) && !isLoading
  const submitButtonText = isLoading ? 'Sending...' : 'Send Link'
  const recoveryButtonText = hasSuccess ? 'Send Link Again' : submitButtonText

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await sendPasswordRecoveryLink({ email: trimmedEmail })
      setSuccessEmail(trimmedEmail)
    } catch {
      setError(MESSAGES.userNotFound)
      setSuccessEmail('')
      setIsRecaptchaChecked(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
      <label className={styles.field}>
        <Text as="span" className={styles.label} size="sm">
          Email
        </Text>
        <input
          aria-describedby={error ? 'forgot-password-error' : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="email"
          className={styles.input}
          disabled={isLoading}
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
            setSuccessEmail('')
          }}
          placeholder="Epam@epam.com"
          type="email"
          value={email}
        />
      </label>

      {error && (
        <Text className={styles.error} id="forgot-password-error" size="sm">
          {error}
        </Text>
      )}

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
        <Button className={styles.submitButton} type="submit" disabled={!canSubmit}>
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
