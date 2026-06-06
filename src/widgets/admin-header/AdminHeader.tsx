import { Header } from '@/widgets/header'

type AdminHeaderRole = 'admin' | 'superAdmin'

type AdminHeaderProps = {
  notificationsCount?: number
  role?: AdminHeaderRole
}

export function AdminHeader({ notificationsCount, role = 'admin' }: AdminHeaderProps) {
  return <Header role={role} notificationsCount={notificationsCount} />
}
