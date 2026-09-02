'use client'

import Image from 'next/image'
import NextLink from 'next/link'

import { SuccesSignUpImage } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import layoutStyles from './sign-up-state-layout.module.css'
import styles from './registration-confirmed.module.css'

export function RegistrationConfirmed() {
  const { t } = useI18n()

  return (
    <AuthViewShell>
      <section className={layoutStyles.root}>
        <div className={layoutStyles.content}>
          <div className={layoutStyles.header}>
            <Title level="h1">{t.auth.signUp.registrationConfirmedTitle}</Title>

            <Text aria-live="polite">{t.auth.signUp.registrationConfirmedMessage}</Text>
          </div>

          <Button asChild className={styles.signInButton}>
            <NextLink href={authRoutes.signIn}>{t.auth.signUp.signInLink}</NextLink>
          </Button>
        </div>

        <Image
          alt={t.auth.signUp.emailConfirmedAlt}
          className={styles.illustration}
          height={300}
          priority
          sizes="432px"
          src={SuccesSignUpImage}
          width={432}
        />
      </section>
    </AuthViewShell>
  )
}
