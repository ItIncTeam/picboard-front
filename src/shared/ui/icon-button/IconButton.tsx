import { type MouseEventHandler, type ReactNode, type SVGProps } from 'react'

import clsx from 'clsx'
import Image from 'next/image'

import styles from './icon-button.module.css'

type IconButtonIconProps = Pick<SVGProps<SVGSVGElement>, 'aria-hidden' | 'className' | 'focusable'>

type IconButtonIcon = (props: IconButtonIconProps) => ReactNode

type IconButtonBaseProps = {
  className?: string
  disabled?: boolean
  indicatorCount?: number
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
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
  const { className, disabled, indicatorCount = 0, label, onClick } = props
  const hasIndicator = indicatorCount > 0

  return (
    <button
      className={clsx(styles.button, className)}
      disabled={disabled}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {getIconElement(props)}
      {hasIndicator && <span className={styles.indicator}>{indicatorCount}</span>}
    </button>
  )
}
