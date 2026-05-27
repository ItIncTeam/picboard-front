import { PublicHeader } from '@/widgets/public-header'

import styles from './public-layout.module.css'

type PublicLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={styles.root}>
      <PublicHeader />
      <main className={styles.content}>{children}</main>
    </div>
  )
}
