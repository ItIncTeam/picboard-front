import { ForgotPasswordForm } from '@/features/auth'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './forgot-password-view.module.css'

export function ForgotPasswordView() {
  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          Forgot Password
        </Title>
        <ForgotPasswordForm />
      </AuthFormCard>
    </AuthViewShell>
  )
}
