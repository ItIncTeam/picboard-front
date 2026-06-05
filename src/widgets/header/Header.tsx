import { NavigationButton } from '@/features/auth'
import { BellIcon } from '@/shared/assets'
import { IconButton } from '@/shared/ui/icon-button'
import { LanguageSwitcher } from '@/shared/ui/language-switcher'
import { Logo } from '@/shared/ui/logo'

import styles from './header.module.css'

type HeaderRole = 'guest' | 'user' | 'admin' | 'superAdmin'

type HeaderProps = {
  notificationsCount?: number
  role?: HeaderRole
}

const logoHref: Record<HeaderRole, string> = {
  guest: '/',
  user: '/main',
  admin: '/admin/users',
  superAdmin: '/admin/users',
}

const logoSuffix: Partial<Record<HeaderRole, string>> = {
  admin: 'Admin',
  superAdmin: 'SuperAdmin',
}

export function Header({ notificationsCount = 0, role = 'user' }: HeaderProps) {
  const hasNotifications = notificationsCount > 0
  const isAuthenticated = role !== 'guest'
  const showAuthActions = !isAuthenticated

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Logo href={logoHref[role]} label="Picboard" suffix={logoSuffix[role]} />
        <div className={styles.actions}>
          <IconButton
            icon={BellIcon}
            indicatorCount={notificationsCount}
            label={
              hasNotifications ? `${notificationsCount} unread notifications` : 'Notifications'
            }
          />

          <LanguageSwitcher />
          {showAuthActions && <NavigationButton />}
        </div>
      </div>
    </header>
  )
}
