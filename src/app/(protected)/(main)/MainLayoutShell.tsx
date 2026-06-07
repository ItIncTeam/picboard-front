'use client'

import { useState } from 'react'

import { AppHeader } from '@/widgets/app-header'
import { Sidebar } from '@/widgets/sidebar'

import styles from './layout.module.css'

type MainLayoutShellProps = Readonly<{
  children: React.ReactNode
}>

export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      <AppHeader isSidebarOpen={isSidebarOpen} onOpenSidebar={openSidebar} />
      <div className={styles.shell}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className={styles.content}>{children}</main>
      </div>
    </>
  )
}
