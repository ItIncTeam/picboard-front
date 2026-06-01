import type { ReactNode } from 'react'

import styles from './public-auth-layout.module.css'

type PublicAuthLayoutProps = {
  children: ReactNode
}

export function PublicAuthLayout({ children }: PublicAuthLayoutProps) {
  return <div className={styles.root}>{children}</div>
}
