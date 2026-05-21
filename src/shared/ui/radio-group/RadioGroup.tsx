'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import type { ComponentPropsWithoutRef } from 'react'

import styles from './radio-group.module.css'

export type RadioGroupProps = {
  className?: string
} & ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>

const joinClassNames = (...classNames: Array<string | undefined>) => {
  return classNames.filter(Boolean).join(' ')
}

export const RadioGroup = ({ className, ...props }: RadioGroupProps) => {
  return <RadioGroupPrimitive.Root className={joinClassNames(styles.group, className)} {...props} />
}
