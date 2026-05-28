import { NavigationButton } from '@/features/auth'
import { IconButton } from '@/shared/ui/icon-button'
import { LanguageSwitcher } from '@/shared/ui/language-switcher'
import { Logo } from '@/shared/ui/logo'

import styles from './header.module.css'

type HeaderRole = 'user' | 'superAdmin'

type HeaderProps = {
  isRegistered?: boolean
  messageCount?: number
  role?: HeaderRole
}

const logoHref: Record<HeaderRole, string> = {
  user: '/main',
  superAdmin: '/admin/users',
}

export function Header({ isRegistered = true, messageCount = 0, role = 'user' }: HeaderProps) {
  const hasMessages = messageCount > 0
  const logoSuffix = role === 'superAdmin' ? 'SuperAdmin' : undefined

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Logo href={logoHref[role]} label="Picboard" suffix={logoSuffix} />
        <div className={styles.actions}>
          {hasMessages && (
            <IconButton
              indicatorCount={messageCount}
              label={`${messageCount} unread messages`}
              src="/bell.svg"
            />
          )}

          <LanguageSwitcher />
          {!isRegistered && <NavigationButton />}
        </div>
      </div>
    </header>
  )
}
