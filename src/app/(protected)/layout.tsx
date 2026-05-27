type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <>{children}</>
}
