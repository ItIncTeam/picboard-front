'use client'

import NextLink from 'next/link'
import { type SyntheticEvent, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { passwordReset } from '@/features/auth/api/passwordRecoveryApi'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Recaptcha } from '@/shared/ui/recaptcha'
import { Text } from '@/shared/ui/typography'

import styles from './forgot-password-form.module.css'

const RECAPTCHA_ACTION = 'password_reset'

const isEmailValid = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function ForgotPasswordForm() {
  const { t } = useI18n()
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
  const recoveryButtonText = hasSuccess
    ? t.auth.forgotPassword.sendLinkAgain
    : t.auth.forgotPassword.sendLink

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError('')

    if (!executeRecaptcha) {
      setError(t.auth.forgotPassword.recaptchaUnavailable)

      return
    }

    setIsLoading(true)

    try {
      const captchaToken = await executeRecaptcha(RECAPTCHA_ACTION)

      await passwordReset({ captchaToken, email: trimmedEmail })
      setSuccessEmail(trimmedEmail)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t.auth.forgotPassword.userNotFound,
      )
      setSuccessEmail('')
      setIsRecaptchaChecked(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <Input
          autoComplete="email"
          disabled={isLoading}
          error={error}
          label={t.auth.forgotPassword.email}
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
        {t.auth.forgotPassword.description}
      </Text>

      {successEmail && (
        <div className={styles.success} role="status" aria-live="polite">
          <Text size="sm">{t.auth.forgotPassword.successTitle}</Text>
          <Text size="sm">{t.auth.forgotPassword.successHint}</Text>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          className={styles.submitButton}
          type="submit"
          disabled={!canSubmit}
          loading={isLoading}
          loadingText={t.auth.forgotPassword.sending}
        >
          {recoveryButtonText}
        </Button>
        <Button asChild className={styles.backButton} type="button" variant="textButton">
          <NextLink href="/auth/sign-in">{t.auth.forgotPassword.backToSignIn}</NextLink>
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
