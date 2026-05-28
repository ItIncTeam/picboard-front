import { Header } from '@/widgets/header'

import styles from './public-layout.module.css'

type PublicLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={styles.root}>
      <Header isRegistered={false} />
      <main className={styles.content}>{children}</main>
    </div>
  )
}
