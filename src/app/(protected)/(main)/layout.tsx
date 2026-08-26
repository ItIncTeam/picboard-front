import { AdaptiveAppShell } from '@/widgets/adaptive-app-shell'

export default function MainLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <>
      <AdaptiveAppShell authenticated>{children}</AdaptiveAppShell>
      {modal}
    </>
  )
}
