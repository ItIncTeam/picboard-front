import { ForgotPasswordForm } from '@/features/auth'
import { AuthCard } from '@/shared/ui/auth-card'
import { Title } from '@/shared/ui/typography'
import { ViewShell } from '@/widgets/view-shell'

import styles from './forgot-password-view.module.css'

export function ForgotPasswordView() {
  return (
    <ViewShell>
      <AuthCard>
        <Title level="h1" className={styles.cardTitleCenter}>
          Forgot Password
        </Title>
        <ForgotPasswordForm />
      </AuthCard>
    </ViewShell>
  )
}
