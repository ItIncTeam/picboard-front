import { Header } from '@/widgets/header/Header'
export default function MainLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
      {modal}
    </>
  )
}
