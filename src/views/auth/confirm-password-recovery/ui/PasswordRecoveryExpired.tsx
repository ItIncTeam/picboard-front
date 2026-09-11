'use client'

import Image from 'next/image'
import NextLink from 'next/link'

import { ExpiredPasswordRecoveryImage } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './password-recovery-expired.module.css'

export function PasswordRecoveryExpired() {
  const { t } = useI18n()

  return (
    <AuthViewShell>
      <section className={styles.root}>
        <div className={styles.content}>
          <div className={styles.header}>
            <Title level="h1">{t.auth.passwordRecoveryExpired.title}</Title>

            <Text>{t.auth.passwordRecoveryExpired.description}</Text>
          </div>

          <Button asChild className={styles.action}>
            <NextLink href={authRoutes.forgotPassword}>
              {t.auth.passwordRecoveryExpired.resendLink}
            </NextLink>
          </Button>
        </div>

        <Image
          alt={t.auth.passwordRecoveryExpired.illustrationAlt}
          className={styles.illustration}
          height={352}
          sizes="474px"
          src={ExpiredPasswordRecoveryImage}
          width={474}
          priority
        />
      </section>
    </AuthViewShell>
  )
}
