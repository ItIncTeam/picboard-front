'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './checkbox.module.css'

export type CheckboxProps = {
  label?: string
  errorMessage?: string
  className?: string
  labelClassName?: string
  controlClassName?: string
} & ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    { label, errorMessage, className, labelClassName, controlClassName, id, disabled, ...props },
    ref,
  ) => {
    const baseId = useId()
    const checkboxId = id ?? `${baseId}-control`
    const isError = Boolean(errorMessage)

    const control = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          styles.checkbox__control,
          isError && styles.checkbox__control_error,
          controlClassName,
        )}
        disabled={disabled}
        aria-invalid={isError || undefined}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={styles.checkbox__indicator}>
          <CheckIcon className={styles.checkbox__checkIcon} aria-hidden />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )

    const fieldClassName = cn(styles.checkbox__field, disabled && styles.checkbox_disabled)

    const field = label ? (
      <label className={fieldClassName}>
        {control}
        <span className={cn(styles.checkbox__label, labelClassName)}>{label}</span>
      </label>
    ) : (
      <div className={fieldClassName}>{control}</div>
    )

    return <div className={cn(styles.checkbox, className)}>{field}</div>
  },
)

Checkbox.displayName = 'Checkbox'
