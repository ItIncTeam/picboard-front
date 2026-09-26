'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import styles from './tooltip.module.css'

type TooltipSide = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['side']

type TooltipProps = Readonly<{
  children: ReactElement
  content: string
  side?: TooltipSide
}>

export const Tooltip = ({ children, content, side = 'top' }: TooltipProps) => {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={styles.content}
          role="tooltip"
          side={side}
          sideOffset={8}
        >
          {content}
          <TooltipPrimitive.Arrow className={styles.arrow} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
