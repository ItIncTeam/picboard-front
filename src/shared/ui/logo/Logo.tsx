import Link from 'next/link'

import styles from './logo.module.css'

type LogoProps = {
  href: string
  label: string
  suffix?: string
}

export function Logo({ href, label, suffix }: LogoProps) {
  return (
    <Link className={styles.logo} href={href}>
      <span>{label}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </Link>
  )
}
