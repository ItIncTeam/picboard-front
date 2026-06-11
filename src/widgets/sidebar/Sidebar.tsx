'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoutButton } from '@/features/auth/logout-button'
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  HomeFilledIcon,
  HomeIcon,
  MessageCircleFilledIcon,
  MessageCircleIcon,
  PersonFilledIcon,
  PersonIcon,
  PlusSquareFilledIcon,
  PlusSquareIcon,
  SearchIcon,
  SearchOutlineIcon,
  TrendingUpFilledIcon,
  TrendingUpIcon,
} from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'

import styles from './sidebar.module.css'

type SidebarIcon = (props: React.ComponentProps<'svg'>) => React.ReactElement
type SidebarLabelKey =
  | 'feed'
  | 'create'
  | 'myProfile'
  | 'messenger'
  | 'search'
  | 'statistics'
  | 'favorites'

type SidebarItem = {
  href: string
  icons: {
    active: SidebarIcon
    inactive: SidebarIcon
  }
  labelKey: SidebarLabelKey
  match?: (pathname: string) => boolean
}

type SidebarProps = {
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
}

const items: SidebarItem[] = [
  {
    href: '/feed',
    icons: {
      active: HomeFilledIcon,
      inactive: HomeIcon,
    },
    labelKey: 'feed',
  },
  {
    href: '/posts/create',
    icons: {
      active: PlusSquareFilledIcon,
      inactive: PlusSquareIcon,
    },
    labelKey: 'create',
  },
  {
    href: '/profile/me',
    icons: {
      active: PersonFilledIcon,
      inactive: PersonIcon,
    },
    labelKey: 'myProfile',
    match: (pathname) => pathname.startsWith('/profile'),
  },
  {
    href: '/messenger',
    icons: {
      active: MessageCircleFilledIcon,
      inactive: MessageCircleIcon,
    },
    labelKey: 'messenger',
  },
  {
    href: '/search',
    icons: {
      active: SearchIcon,
      inactive: SearchOutlineIcon,
    },
    labelKey: 'search',
  },
  {
    href: '/statistics',
    icons: {
      active: TrendingUpFilledIcon,
      inactive: TrendingUpIcon,
    },
    labelKey: 'statistics',
  },
  {
    href: '/favorites',
    icons: {
      active: BookmarkFilledIcon,
      inactive: BookmarkIcon,
    },
    labelKey: 'favorites',
  },
]

const isActiveItem = (item: SidebarItem, pathname: string) => {
  if (item.match) {
    return item.match(pathname)
  }

  return pathname === item.href
}

export function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const isHiddenOnMobile = isMobile && !isOpen
  const isMobileSidebarOpen = isMobile && isOpen
  const closeAfterMobileNavigation = () => {
    if (isMobile) {
      onClose()
    }
  }

  return (
    <>
      {isMobileSidebarOpen && (
        <button
          aria-label={t.sidebar.closeNavigation}
          className={styles.backdrop}
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        aria-hidden={isHiddenOnMobile}
        aria-label={t.sidebar.mainSidebar}
        className={styles.sidebar}
        data-open={isOpen}
        id="app-sidebar"
        inert={isHiddenOnMobile ? true : undefined}
      >
        <nav aria-label={t.sidebar.mainNavigation} className={styles.nav}>
          <ul className={styles.list}>
            {items.map((item) => {
              const isActive = isActiveItem(item, pathname)
              const Icon = isActive ? item.icons.active : item.icons.inactive

              return (
                <li key={item.href}>
                  <Link
                    aria-current={isActive ? 'page' : undefined}
                    className={styles.link}
                    data-active={isActive}
                    href={item.href}
                    onClick={closeAfterMobileNavigation}
                  >
                    <Icon aria-hidden className={styles.icon} focusable="false" />
                    <span className={styles.linkText}>{t.sidebar[item.labelKey]}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className={styles.logout}>
            <LogoutButton
              className={styles.logoutButton}
              iconClassName={styles.icon}
              variant="navigation"
            />
          </div>
        </nav>
      </aside>
    </>
  )
}
