import { type ComponentType, type ReactNode, type SVGProps } from 'react'

import Image from 'next/image'

import styles from './icon-button.module.css'

type IconButtonIcon = ComponentType<SVGProps<SVGSVGElement>>

type IconButtonBaseProps = {
  indicatorCount?: number
  label: string
}

type IconButtonProps = IconButtonBaseProps &
  (
    | {
        icon: IconButtonIcon
        src?: undefined
      }
    | {
        icon?: undefined
        src: string
      }
  )

function getIconElement(props: IconButtonProps): ReactNode {
  if (props.icon) {
    const Icon = props.icon

    return <Icon className={styles.icon} aria-hidden focusable="false" />
  }

  return <Image className={styles.icon} src={props.src} alt="" width={24} height={24} aria-hidden />
}

export function IconButton(props: IconButtonProps) {
  const { indicatorCount = 0, label } = props
  const hasIndicator = indicatorCount > 0

  return (
    <button className={styles.button} type="button" aria-label={label}>
      {getIconElement(props)}
      {hasIndicator && <span className={styles.indicator}>{indicatorCount}</span>}
    </button>
  )
}
