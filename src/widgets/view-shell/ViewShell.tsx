import type { ReactNode } from 'react'

import styles from './view-shell.module.css'

type ViewShellProps = {
  children: ReactNode
}

export function ViewShell({ children }: ViewShellProps) {
  return <div className={styles.root}>{children}</div>
}
