import { ProfileRouteShell } from './ProfileRouteShell'

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ProfileRouteShell>{children}</ProfileRouteShell>
}
