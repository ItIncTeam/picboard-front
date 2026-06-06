import { AdminHeader } from '@/widgets/admin-header'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AdminHeader />
      {children}
    </>
  )
}
