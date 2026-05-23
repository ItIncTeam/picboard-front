'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './select.module.css'

export type SelectItemProps = {
  className?: string
} & ComponentPropsWithoutRef<typeof SelectPrimitive.Item>

export const SelectItem = ({ className, children, ...props }: SelectItemProps) => {
  return (
    <SelectPrimitive.Item className={cn(styles.item, className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
