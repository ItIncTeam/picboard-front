'use client'

import { useEffect, useState } from 'react'

import { AppHeader } from '@/widgets/app-header'
import { Sidebar } from '@/widgets/sidebar'

import styles from './layout.module.css'

type MainLayoutShellProps = Readonly<{
  children: React.ReactNode
}>

const mobileSidebarQuery = '(width < 768px)'
const sidebarCollapsedStorageKey = 'sidebar-collapsed'

export function MainLayoutShell({ children }: MainLayoutShellProps) {
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
    if (!isMobile || !isMobileSidebarOpen) {
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
  }, [isMobile, isMobileSidebarOpen])

  return (
    <>
      <AppHeader
        isSidebarOpen={isMobile ? isMobileSidebarOpen : !isSidebarCollapsed}
        onToggleSidebarAction={toggleSidebar}
      />
      <div className={styles.shell}>
        <Sidebar
          isMobile={isMobile}
          isOpen={isMobile ? isMobileSidebarOpen : !isSidebarCollapsed}
          onCloseAction={closeSidebar}
          onToggleSidebarAction={toggleSidebar}
        />
        <main className={styles.content} data-sidebar-collapsed={!isMobile && isSidebarCollapsed}>
          {children}
        </main>
      </div>
    </>
  )
}
