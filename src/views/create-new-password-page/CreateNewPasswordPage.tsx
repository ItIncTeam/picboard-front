'use client'

import { CreateNewPasswordForm } from '@/features/auth/create-new-password-form'
import { useI18n } from '@/shared/lib/i18n'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './create-new-password-page.module.css'

export function CreateNewPasswordPage() {
  const { t } = useI18n()

  return (
    <AuthViewShell>
      <AuthFormCard gap={0} className={styles.authFormCart}>
        <Title level="h1" mb="37px" className={styles.title}>
          {t.auth.createNewPassword.title}
        </Title>
        <CreateNewPasswordForm />
      </AuthFormCard>
    </AuthViewShell>
  )
}
