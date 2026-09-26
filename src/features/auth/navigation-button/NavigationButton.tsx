'use client'

import Link from 'next/link'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'

import styles from './navigation-button.module.css'

export function NavigationButton() {
  const { t } = useI18n()

  return (
    <div className={styles.root}>
      <Link className={styles.loginLink} href="/auth/sign-in">
        {t.auth.navigation.logIn}
      </Link>
      <Button asChild>
        <Link href="/auth/sign-up">{t.auth.navigation.signUp}</Link>
      </Button>
    </div>
  )
}
