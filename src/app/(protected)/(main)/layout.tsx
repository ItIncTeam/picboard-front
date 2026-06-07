import { MainLayoutShell } from './MainLayoutShell'

export default function MainLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <>
      <MainLayoutShell>{children}</MainLayoutShell>
      {modal}
    </>
  )
}
