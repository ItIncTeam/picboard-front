import NextLink from 'next/link'

import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { authRoutes } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './registration-confirmed.module.css'

export function RegistrationConfirmed() {
  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          Congratulations!
        </Title>

        <div className={styles.content}>
          <Text className={styles.message} aria-live="polite">
            Your email has been confirmed
          </Text>

          <Button asChild className={styles.signInButton}>
            <NextLink href={authRoutes.signIn}>Sign In</NextLink>
          </Button>
        </div>
      </AuthFormCard>
    </AuthViewShell>
  )
}
