import { CreateNewPasswordForm } from '@/features/auth/create-new-password-form'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './create-new-password-page.module.css'

export function CreateNewPasswordPage() {
  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          Create New Password
        </Title>
        <CreateNewPasswordForm />
      </AuthFormCard>
    </AuthViewShell>
  )
}
