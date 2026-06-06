import { Header } from '@/widgets/header'

type AppHeaderProps = {
  notificationsCount?: number
}

export function AppHeader({ notificationsCount }: AppHeaderProps) {
  return <Header role="user" notificationsCount={notificationsCount} />
}
