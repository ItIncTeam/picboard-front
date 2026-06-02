import { ForgotPasswordForm } from '@/features/auth'
import { AuthCard } from '@/shared/ui/auth-card'
import { Title } from '@/shared/ui/typography'
import { PublicAuthLayout } from '@/widgets/public-auth-layout'

import styles from './forgot-password-view.module.css'

export function ForgotPasswordView() {
  return (
    <PublicAuthLayout>
      <AuthCard className={styles.formState}>
        <Title level="h1" className={styles.cardTitleCenter}>
          Forgot Password
        </Title>
        <ForgotPasswordForm />
      </AuthCard>
    </PublicAuthLayout>
  )
}
