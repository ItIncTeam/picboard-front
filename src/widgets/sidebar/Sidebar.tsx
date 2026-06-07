'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoutButton } from '@/features/auth/logout-button'
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  Close,
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
import { IconButton } from '@/shared/ui/icon-button'

import styles from './sidebar.module.css'

type SidebarIcon = (props: React.ComponentProps<'svg'>) => React.ReactElement

type SidebarItem = {
  href: string
  icons: {
    active: SidebarIcon
    inactive: SidebarIcon
  }
  label: string
  match?: (pathname: string) => boolean
}

type SidebarProps = {
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
    label: 'Feed',
  },
  {
    href: '/posts/create',
    icons: {
      active: PlusSquareFilledIcon,
      inactive: PlusSquareIcon,
    },
    label: 'Create',
  },
  {
    href: '/profile/me',
    icons: {
      active: PersonFilledIcon,
      inactive: PersonIcon,
    },
    label: 'My Profile',
    match: (pathname) => pathname.startsWith('/profile'),
  },
  {
    href: '/messenger',
    icons: {
      active: MessageCircleFilledIcon,
      inactive: MessageCircleIcon,
    },
    label: 'Messenger',
  },
  {
    href: '/search',
    icons: {
      active: SearchIcon,
      inactive: SearchOutlineIcon,
    },
    label: 'Search',
  },
  {
    href: '/statistics',
    icons: {
      active: TrendingUpFilledIcon,
      inactive: TrendingUpIcon,
    },
    label: 'Statistics',
  },
  {
    href: '/favorites',
    icons: {
      active: BookmarkFilledIcon,
      inactive: BookmarkIcon,
    },
    label: 'Favorites',
  },
]

const isActiveItem = (item: SidebarItem, pathname: string) => {
  if (item.match) {
    return item.match(pathname)
  }

  return pathname === item.href
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close sidebar navigation"
          className={styles.backdrop}
          onClick={onClose}
          type="button"
        />
      )}

      <aside className={styles.sidebar} data-open={isOpen} id="app-sidebar">
        <IconButton
          className={styles.closeButton}
          icon={Close}
          label="Close sidebar navigation"
          onClick={onClose}
        />
        <nav aria-label="Main navigation" className={styles.nav}>
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
                    onClick={onClose}
                  >
                    <Icon aria-hidden className={styles.icon} focusable="false" />
                    <span>{item.label}</span>
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
