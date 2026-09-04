'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

import { ForgotPasswordForm } from '@/features/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'
import { useI18n } from '@/shared/lib/i18n'

import styles from './forgot-password-view.module.css'

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

export function ForgotPasswordView() {
  const { t } = useI18n()

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <AuthViewShell>
        <AuthFormCard>
          <Title level="h1" className={styles.cardTitleCenter}>
            {t.auth.forgotPassword.title}
          </Title>
          <ForgotPasswordForm />
        </AuthFormCard>
      </AuthViewShell>
    </GoogleReCaptchaProvider>
  )
}
