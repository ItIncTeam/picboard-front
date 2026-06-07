import { Header } from '@/widgets/header'

type AppHeaderProps = {
  isSidebarOpen?: boolean
  notificationsCount?: number
  onOpenSidebar?: () => void
}

export function AppHeader({ isSidebarOpen, notificationsCount, onOpenSidebar }: AppHeaderProps) {
  return (
    <Header
      isSidebarOpen={isSidebarOpen}
      role="user"
      notificationsCount={notificationsCount}
      onOpenSidebar={onOpenSidebar}
    />
  )
}
