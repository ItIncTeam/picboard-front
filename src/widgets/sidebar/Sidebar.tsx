'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeftIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

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
import { Tooltip } from '@/shared/ui/tooltip'

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
  onCloseAction: () => void
  onToggleSidebarAction: () => void
}

const items: SidebarItem[] = [
  {
    href: '/main',
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

export function Sidebar({ isMobile, isOpen, onCloseAction, onToggleSidebarAction }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.toString()
  const returnTo = `${pathname}${currentSearch ? `?${currentSearch}` : ''}`

  const createPostHref = `/posts/create?returnTo=${encodeURIComponent(returnTo)}`
  const isHiddenOnMobile = isMobile && !isOpen
  const isMobileSidebarOpen = isMobile && isOpen
  const shouldShowCollapsedTooltips = !isMobile && !isOpen
  const closeAfterMobileNavigation = () => {
    if (isMobile) {
      onCloseAction()
    }
  }

  return (
    <>
      {isMobileSidebarOpen && (
        <button
          aria-label={t.sidebar.closeNavigation}
          className={styles.backdrop}
          onClick={onCloseAction}
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
        <button
          aria-controls="app-sidebar"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Свернуть sidebar' : 'Развернуть sidebar'}
          className={styles.toggleButton}
          data-open={isOpen}
          onClick={onToggleSidebarAction}
          type="button"
        >
          <ChevronLeftIcon aria-hidden className={styles.toggleIcon} />
        </button>

        <nav aria-label={t.sidebar.mainNavigation} className={styles.nav}>
          <ul className={styles.list}>
            {items.map((item) => {
              const isActive = isActiveItem(item, pathname)
              const Icon = isActive ? item.icons.active : item.icons.inactive
              const label = t.sidebar[item.labelKey]
              const link = (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={styles.link}
                  data-active={isActive}
                  href={item.href === '/posts/create' ? createPostHref : item.href}
                  onClick={closeAfterMobileNavigation}
                >
                  <Icon aria-hidden className={styles.icon} focusable="false" />
                  <span className={styles.linkText}>{label}</span>
                </Link>
              )

              return (
                <li key={item.href}>
                  {shouldShowCollapsedTooltips ? (
                    <Tooltip content={label} side="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
          <div className={styles.logout}>
            <LogoutButton
              className={styles.logoutButton}
              iconClassName={styles.icon}
              tooltip={shouldShowCollapsedTooltips ? t.auth.logout.logOut : undefined}
              variant="navigation"
            />
          </div>
        </nav>
      </aside>
    </>
  )
}
