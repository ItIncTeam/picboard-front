'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

import { ForgotPasswordForm } from '@/features/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './forgot-password-view.module.css'

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

export function ForgotPasswordView() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <AuthViewShell>
        <AuthFormCard>
          <Title level="h1" className={styles.cardTitleCenter}>
            Forgot Password
          </Title>
          <ForgotPasswordForm />
        </AuthFormCard>
      </AuthViewShell>
    </GoogleReCaptchaProvider>
  )
}
