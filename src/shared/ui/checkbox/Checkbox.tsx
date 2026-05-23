'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './checkbox.module.css'

export type CheckboxProps = {
  label?: string
  className?: string
  labelClassName?: string
} & ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, className, labelClassName, id, disabled, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id ?? generatedId

    const rootClassName = cn(styles.root, disabled && styles.rootDisabled, className)

    const control = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={styles.control}
        disabled={disabled}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={styles.indicator}>
          <CheckIcon className={styles.checkIcon} aria-hidden />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
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

Checkbox.displayName = 'Checkbox'
