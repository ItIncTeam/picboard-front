import { SettingsNavigation } from '@/widgets/settings-navigation'

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <SettingsNavigation />
      {children}
    </>
  )
}
