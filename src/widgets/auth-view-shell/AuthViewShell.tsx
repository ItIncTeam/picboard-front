import type { ReactNode } from 'react'

import styles from './auth-view-shell.module.css'

type AuthViewShellProps = {
  children: ReactNode
}

export function AuthViewShell({ children }: AuthViewShellProps) {
  return <div className={styles.root}>{children}</div>
}
