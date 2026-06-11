import Link from 'next/link'
import Image from 'next/image'

import styles from './logo.module.css'

type LogoProps = {
  href: string
  label: string
  suffix?: string
}

export function Logo({ href, label, suffix }: LogoProps) {
  return (
    <Link className={styles.logo} href={href}>
      <Image
        aria-hidden
        className={styles.icon}
        src="/favicons/icon.svg"
        alt=""
        width={32}
        height={32}
      />
      <span className={styles.label}>{label}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </Link>
  )
}
