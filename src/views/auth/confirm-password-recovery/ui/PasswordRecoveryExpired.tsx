import Image from 'next/image'
import NextLink from 'next/link'

import { ExpiredSignUpImage } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './password-recovery-expired.module.css'

export function PasswordRecoveryExpired() {
  return (
    <AuthViewShell>
      <section className={styles.root}>
        <div className={styles.content}>
          <div className={styles.header}>
            <Title level="h1">Email verification link expired</Title>

            <Text>
              Looks like the verification link has expired. Not to worry, we can send the link again
            </Text>
          </div>

          <Button asChild className={styles.action}>
            <NextLink href={authRoutes.forgotPassword}>Resend link</NextLink>
          </Button>
        </div>

        <Image
          alt="Verification link expired illustration"
          className={styles.illustration}
          height={352}
          sizes="474px"
          src={ExpiredSignUpImage}
          width={474}
          priority
        />
      </section>
    </AuthViewShell>
  )
}
