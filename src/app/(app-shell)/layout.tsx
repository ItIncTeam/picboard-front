import { AppRouteShell } from './AppRouteShell'

type AppShellLayoutProps = Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>

export default function AppShellLayout({ children, modal }: AppShellLayoutProps) {
  return (
    <>
      <AppRouteShell>{children}</AppRouteShell>
      {modal}
    </>
  )
}
