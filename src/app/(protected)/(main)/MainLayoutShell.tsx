'use client'

import { useEffect, useState } from 'react'

import { AppHeader } from '@/widgets/app-header'
import { Sidebar } from '@/widgets/sidebar'

import styles from './layout.module.css'

type MainLayoutShellProps = Readonly<{
  children: React.ReactNode
}>

const mobileSidebarQuery = '(width < 768px)'

export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsMobileSidebarOpen((currentValue) => !currentValue)
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
      <AppHeader isSidebarOpen={isMobileSidebarOpen} onToggleSidebarAction={toggleSidebar} />
      <div className={styles.shell}>
        <Sidebar isMobile={isMobile} isOpen={isMobileSidebarOpen} onCloseAction={closeSidebar} />
        <main className={styles.content}>{children}</main>
      </div>
    </>
  )
}
