'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

type TooltipProviderProps = Readonly<{
  children: ReactNode
}>

export const TooltipProvider = ({ children }: TooltipProviderProps) => {
  return (
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.Provider>
  )
}
