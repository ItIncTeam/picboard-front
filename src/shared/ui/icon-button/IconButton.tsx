import { forwardRef, type MouseEventHandler, type ReactNode, type SVGProps } from 'react'

import clsx from 'clsx'
import Image from 'next/image'

import { Tooltip } from '@/shared/ui/tooltip'

import styles from './icon-button.module.css'

type IconButtonIconProps = Pick<SVGProps<SVGSVGElement>, 'aria-hidden' | 'className' | 'focusable'>

type IconButtonIcon = (props: IconButtonIconProps) => ReactNode

type IconButtonBaseProps = {
  className?: string
  disabled?: boolean
  indicatorCount?: number
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  tooltip?: string
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

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    const { className, disabled, indicatorCount = 0, label, onClick, tooltip } = props
    const hasIndicator = indicatorCount > 0

    const button = (
      <button
        ref={ref}
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

    if (!tooltip) {
      return button
    }

    return (
      <Tooltip content={tooltip} side="bottom">
        <span className={styles.tooltipTrigger}>{button}</span>
      </Tooltip>
    )
  },
)
