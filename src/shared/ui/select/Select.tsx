'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './select.module.css'

export type SelectProps = {
  label?: string
  placeholder?: string
  startAdornment?: ReactNode
  className?: string
  labelClassName?: string
  controlClassName?: string
} & ComponentPropsWithoutRef<typeof SelectPrimitive.Root>

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      placeholder,
      startAdornment,
      className,
      labelClassName,
      controlClassName,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseId = useId()
    const triggerId = `${baseId}-trigger`
    const labelId = `${baseId}-label`

    const rootClassName = cn(
      styles.root,
      label && styles.withLabel,
      disabled && styles.rootDisabled,
      className,
    )

    const control = (
      <SelectPrimitive.Trigger
        ref={ref}
        id={triggerId}
        className={cn(styles.control, controlClassName)}
        aria-label={label ? undefined : placeholder}
        aria-labelledby={label ? labelId : undefined}
      >
        {startAdornment ? <span className={styles.adornment}>{startAdornment}</span> : null}
        <SelectPrimitive.Value placeholder={placeholder} className={styles.value} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className={styles.icon} aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    )

    return (
      <div className={rootClassName}>
        {label ? (
          <label id={labelId} htmlFor={triggerId} className={cn(styles.label, labelClassName)}>
            {label}
          </label>
        ) : null}
        <SelectPrimitive.Root disabled={disabled} {...props}>
          {control}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={styles.content}
              position="popper"
              sideOffset={0}
              align="start"
            >
              <SelectPrimitive.Viewport className={styles.viewport}>
                {children}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    )
  },
)

Select.displayName = 'Select'
