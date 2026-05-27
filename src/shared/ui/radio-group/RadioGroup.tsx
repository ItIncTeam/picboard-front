'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { RadioGroupItem } from './RadioGroupItem'
import styles from './radio-group.module.css'

export type RadioGroupOption = {
  value: string
  label: string
  disabled?: boolean
}

type RadioGroupSharedProps = {
  label?: string
  errorMessage?: string
  className?: string
  labelClassName?: string
}

type RadioGroupRootProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>

export type RadioGroupProps =
  | (RadioGroupSharedProps &
      RadioGroupRootProps & {
        options: ReadonlyArray<RadioGroupOption>
        children?: never
      })
  | (RadioGroupSharedProps &
      RadioGroupRootProps & {
        options?: never
        children?: ReactNode
      })

export const RadioGroup = ({
  label,
  errorMessage,
  className,
  labelClassName,
  disabled,
  options,
  children,
  ...props
}: RadioGroupProps) => {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const errorId = `${baseId}-error`
  const isError = Boolean(errorMessage)

  const items = options
    ? options.map((option) => (
        <RadioGroupItem
          key={option.value}
          value={option.value}
          label={option.label}
          disabled={option.disabled}
        />
      ))
    : children

  return (
    <div className={cn(styles.radioGroup, className)}>
      {label ? (
        <span id={labelId} className={cn(styles.radioGroup__label, labelClassName)}>
          {label}
        </span>
      ) : null}
      <RadioGroupPrimitive.Root
        className={cn(styles.radioGroup__group, isError && styles.radioGroup__group_error)}
        disabled={disabled}
        aria-invalid={isError || undefined}
        aria-describedby={isError ? errorId : undefined}
        aria-labelledby={label ? labelId : undefined}
        {...props}
      >
        {items}
      </RadioGroupPrimitive.Root>
      {errorMessage ? (
        <span id={errorId} className={styles.radioGroup__errorMessage} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </div>
  )
}
