'use client'

import { NavigationButton } from '@/features/auth'
import { BellIcon, MenuIcon } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { IconButton } from '@/shared/ui/icon-button'
import { LanguageSwitcher } from '@/shared/ui/language-switcher'
import { Logo } from '@/shared/ui/logo'

import styles from './header.module.css'

type HeaderRole = 'guest' | 'user' | 'admin' | 'superAdmin'

type HeaderProps = {
  isSidebarOpen?: boolean
  notificationsCount?: number
  onOpenSidebar?: () => void
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

export function Header({
  isSidebarOpen = false,
  notificationsCount = 0,
  onOpenSidebar,
  role = 'user',
}: HeaderProps) {
  const hasNotifications = notificationsCount > 0
  const isAuthenticated = role !== 'guest'
  const showAuthActions = !isAuthenticated
  const showSidebarTrigger = isAuthenticated && onOpenSidebar
  const { t } = useI18n()

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        {showSidebarTrigger && (
          <IconButton
            className={styles.sidebarTrigger}
            icon={MenuIcon}
            label={isSidebarOpen ? t.header.sidebarOpen : t.header.openSidebar}
            onClick={onOpenSidebar}
          />
        )}
        <Logo href={logoHref[role]} label="Picboard" suffix={logoSuffix[role]} />
        <div className={styles.actions}>
          <IconButton
            disabled
            icon={BellIcon}
            indicatorCount={notificationsCount}
            label={
              hasNotifications
                ? `${notificationsCount} unread notifications. Notifications are not available yet.`
                : t.header.notificationsUnavailable
            }
          />

          <LanguageSwitcher />
          {showAuthActions && <NavigationButton />}
        </div>
      </div>
    </header>
  )
}
