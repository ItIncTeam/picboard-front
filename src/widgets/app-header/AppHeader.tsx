import { Header } from '@/widgets/header'

type AppHeaderProps = {
  isSidebarOpen?: boolean
  notificationsCount?: number
  onToggleSidebar?: () => void
}

export function AppHeader({ isSidebarOpen, notificationsCount, onToggleSidebar }: AppHeaderProps) {
  return (
    <Header
      isSidebarOpen={isSidebarOpen}
      role="user"
      notificationsCount={notificationsCount}
      onToggleSidebar={onToggleSidebar}
    />
  )
}
