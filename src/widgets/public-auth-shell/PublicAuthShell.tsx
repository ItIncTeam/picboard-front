import type { ReactNode } from 'react'

import styles from './public-auth-shell.module.css'

type PublicAuthShellProps = {
  children?: ReactNode
  description?: string
  title: string
}

export function PublicAuthShell({ children, description, title }: PublicAuthShellProps) {
  return (
    <section className={styles.root} aria-labelledby="public-auth-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 id="public-auth-title" className={styles.title}>
            {title}
          </h1>
          {description && <p className={styles.description}>{description}</p>}
        </header>

        {children && <div className={styles.content}>{children}</div>}
      </div>
    </section>
  )
}
