import Link from 'next/link'

import { Button } from '@/shared/ui/button'

import styles from './navigation-button.module.css'

export function NavigationButton() {
  return (
    <div className={styles.root}>
      <Link className={styles.loginLink} href="/auth/sign-in">
        Log in
      </Link>
      <Button asChild>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  )
}
