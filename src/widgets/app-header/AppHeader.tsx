import { Header } from '@/widgets/header'

type AppHeaderProps = {
  isSidebarOpen?: boolean
  notificationsCount?: number
  onToggleSidebarAction?: () => void
}

export function AppHeader({
  isSidebarOpen,
  notificationsCount,
  onToggleSidebarAction,
}: AppHeaderProps) {
  return (
    <Header
      isSidebarOpen={isSidebarOpen}
      role="user"
      notificationsCount={notificationsCount}
      onToggleSidebarAction={onToggleSidebarAction}
    />
  )
}
