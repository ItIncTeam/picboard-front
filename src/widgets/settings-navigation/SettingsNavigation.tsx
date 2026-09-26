'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useI18n } from '@/shared/lib/i18n'

import styles from './settings-navigation.module.css'

type SettingsNavigationLabelKey =
  | 'accountManagement'
  | 'devices'
  | 'generalInformation'
  | 'notifications'

type SettingsNavigationItem = {
  href: string
  labelKey: SettingsNavigationLabelKey
}

const items: SettingsNavigationItem[] = [
  { href: '/settings/profile', labelKey: 'generalInformation' },
  { href: '/settings/devices', labelKey: 'devices' },
  { href: '/settings/account', labelKey: 'accountManagement' },
  { href: '/settings/notifications', labelKey: 'notifications' },
]

export function SettingsNavigation() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav aria-label={t.settings.navigation.label} className={styles.root}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = pathname === item.href

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={styles.link}
                data-active={isActive}
                href={item.href}
              >
                {t.settings.navigation[item.labelKey]}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
