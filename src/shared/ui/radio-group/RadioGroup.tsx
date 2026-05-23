'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './radio-group.module.css'

export type RadioGroupProps = {
  className?: string
} & ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>

export const RadioGroup = ({ className, ...props }: RadioGroupProps) => {
  return <RadioGroupPrimitive.Root className={cn(styles.group, className)} {...props} />
}
