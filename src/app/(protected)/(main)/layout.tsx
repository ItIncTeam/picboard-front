import { AppHeader } from '@/widgets/app-header'

export default function MainLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <>
      <AppHeader />
      {children}
      {modal}
    </>
  )
}
