import Image from 'next/image'

import styles from './icon-button.module.css'

type IconButtonProps = {
  indicatorCount?: number
  label: string
  src: string
}

export function IconButton({ indicatorCount = 0, label, src }: IconButtonProps) {
  const hasIndicator = indicatorCount > 0

  return (
    <button className={styles.button} type="button" aria-label={label}>
      <Image src={src} alt="" width={24} height={24} aria-hidden />
      {hasIndicator && <span className={styles.indicator}>{indicatorCount}</span>}
    </button>
  )
}
