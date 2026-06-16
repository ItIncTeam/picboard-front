'use client'

import { NavigationButton } from '@/features/auth'
import { BellIcon } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { IconButton } from '@/shared/ui/icon-button'
import { LanguageSwitcher } from '@/shared/ui/language-switcher'
import { Logo } from '@/shared/ui/logo'

import styles from './header.module.css'

type HeaderRole = 'guest' | 'user' | 'admin' | 'superAdmin'

type HeaderProps = {
  isSidebarOpen?: boolean
  notificationsCount?: number
  onToggleSidebar?: () => void
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
  onToggleSidebar,
  role = 'user',
}: HeaderProps) {
  const hasNotifications = notificationsCount > 0
  const isAuthenticated = role !== 'guest'
  const showAuthActions = !isAuthenticated
  const showSidebarTrigger = isAuthenticated && onToggleSidebar
  const { t } = useI18n()

  return (
    <header className={styles.root}>
      <div className={styles.inner} data-guest={showAuthActions}>
        {showSidebarTrigger && (
          <button
            aria-controls="app-sidebar"
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? t.header.closeSidebar : t.header.openSidebar}
            className={styles.sidebarTrigger}
            data-open={isSidebarOpen}
            onClick={onToggleSidebar}
            type="button"
          >
            <span className={styles.sidebarTriggerIcon} aria-hidden>
              <span className={styles.sidebarTriggerLine} />
              <span className={styles.sidebarTriggerLine} />
              <span className={styles.sidebarTriggerLine} />
            </span>
          </button>
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
            tooltip={t.header.notificationsUnavailable}
          />

          <LanguageSwitcher />
          {showAuthActions && (
            <div className={styles.authActions}>
              <NavigationButton />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
