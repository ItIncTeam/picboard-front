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

    const fieldClassName = cn(
      styles.radioGroup__field,
      disabled && styles.radioGroup_disabled,
      className,
    )

    const control = (
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={styles.radioGroup__control}
        disabled={disabled}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className={styles.radioGroup__indicator} />
      </RadioGroupPrimitive.Item>
    )

    if (!label) {
      return <div className={fieldClassName}>{control}</div>
    }

    return (
      <label className={fieldClassName}>
        {control}
        <span className={cn(styles.radioGroup__itemLabel, labelClassName)}>{label}</span>
      </label>
    )
  },
)

RadioGroupItem.displayName = 'RadioGroupItem'
