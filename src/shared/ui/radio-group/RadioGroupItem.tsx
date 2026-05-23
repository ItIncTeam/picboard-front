'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './radio-group.module.css'

export type RadioGroupItemProps = {
  label?: string
  className?: string
  labelClassName?: string
} & ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>

export const RadioGroupItem = forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ label, className, labelClassName, id, disabled, ...props }, ref) => {
    const generatedId = useId()
    const itemId = id ?? generatedId

    const rootClassName = cn(styles.root, disabled && styles.rootDisabled, className)

    const control = (
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={styles.control}
        disabled={disabled}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className={styles.indicator} />
      </RadioGroupPrimitive.Item>
    )

    if (!label) {
      return <div className={rootClassName}>{control}</div>
    }

    return (
      <label className={rootClassName}>
        {control}
        <span className={cn(styles.label, labelClassName)}>{label}</span>
      </label>
    )
  },
)

RadioGroupItem.displayName = 'RadioGroupItem'
