'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { AppHeader } from '@/widgets/app-header'
import { PublicHeader } from '@/widgets/public-header'
import { Sidebar } from '@/widgets/sidebar'

import styles from './adaptive-app-shell.module.css'

type AdaptiveAppShellProps = Readonly<{
  authenticated: boolean
  children: ReactNode
  pending?: boolean
}>

const mobileSidebarQuery = '(width < 768px)'
const sidebarCollapsedStorageKey = 'sidebar-collapsed'

export function AdaptiveAppShell({
  authenticated,
  children,
  pending = false,
}: AdaptiveAppShellProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((currentValue) => !currentValue)
      return
    }

    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue

      window.localStorage.setItem(sidebarCollapsedStorageKey, String(nextValue))

      return nextValue
    })
  }

  const closeSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileSidebarQuery)

    const updateIsMobile = () => {
      const nextIsMobile = mediaQuery.matches

      setIsMobile(nextIsMobile)

      if (!nextIsMobile) {
        setIsMobileSidebarOpen(false)
      }
    }

    updateIsMobile()
    mediaQuery.addEventListener('change', updateIsMobile)

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile)
    }
  }, [])

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      setIsSidebarCollapsed(window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true')
    })

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  useEffect(() => {
    if (!authenticated || !isMobile || !isMobileSidebarOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [authenticated, isMobile, isMobileSidebarOpen])

  const isSidebarOpen = isMobile ? isMobileSidebarOpen : !isSidebarCollapsed
  let header = <PublicHeader />

  if (pending) {
    header = <div aria-hidden="true" className={styles.pendingHeader} />
  } else if (authenticated) {
    header = <AppHeader isSidebarOpen={isSidebarOpen} onToggleSidebarAction={toggleSidebar} />
  }

  return (
    <div className={styles.root} data-authenticated={authenticated}>
      {header}
      <div className={styles.shell}>
        {!pending && authenticated && (
          <Sidebar
            isMobile={isMobile}
            isOpen={isSidebarOpen}
            onCloseAction={closeSidebar}
            onToggleSidebarAction={toggleSidebar}
          />
        )}
        <main
          className={styles.content}
          data-sidebar-collapsed={authenticated && !isMobile && isSidebarCollapsed}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
