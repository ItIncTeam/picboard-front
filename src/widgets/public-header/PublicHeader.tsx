import type { ReactNode } from 'react'

import styles from './public-header.module.css'

type PublicHeaderProps = {
  leftSlot?: ReactNode
}

export function PublicHeader({ leftSlot }: PublicHeaderProps) {
  return (
    <header className={styles.root}>
      <div className={styles.nav}>
        <div className={styles.leftArea}>{leftSlot}</div>

        <span className={styles.logo}>Picboard</span>

        <span className={styles.languagePlaceholder}>English</span>
      </div>
    </header>
  )
}
