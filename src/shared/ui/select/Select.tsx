'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { forwardRef, useId, useState, type ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import { SelectItem } from './SelectItem'
import { SelectOptionImage } from './SelectOptionImage'
import styles from './select.module.css'

export type SelectOption = {
  value: string
  label: string
  image?: string
  imageAlt?: string
  disabled?: boolean
}

export type SelectSharedProps = {
  options: ReadonlyArray<SelectOption>
  label?: string
  placeholder?: string
  errorMessage?: string
  className?: string
  labelClassName?: string
  triggerClassName?: string
}

export type SelectProps = SelectSharedProps & ComponentPropsWithoutRef<typeof SelectPrimitive.Root>

const findSelectedOption = (
  options: ReadonlyArray<SelectOption>,
  value: string | undefined,
): SelectOption | undefined => {
  if (!value) {
    return undefined
  }

  return options.find((option) => option.value === value)
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      label,
      placeholder,
      errorMessage,
      className,
      labelClassName,
      triggerClassName,
      disabled,
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const baseId = useId()
    const triggerId = `${baseId}-trigger`
    const labelId = `${baseId}-label`
    const errorId = `${baseId}-error`
    const isError = Boolean(errorMessage)
    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
    const currentValue = isControlled ? value : uncontrolledValue
    const selectedOption = findSelectedOption(options, currentValue)

    const handleValueChange = (nextValue: string): void => {
      if (!isControlled) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue)
    }

    const selectClassName = cn(styles.select, disabled && styles.select_disabled, className)

    return (
      <div className={selectClassName}>
        {label ? (
          <label
            id={labelId}
            htmlFor={triggerId}
            className={cn(styles['select__label'], labelClassName)}
          >
            {label}
          </label>
        ) : null}
        <SelectPrimitive.Root
          disabled={disabled}
          value={currentValue}
          onValueChange={handleValueChange}
          {...props}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={triggerId}
            className={cn(
              styles['select__trigger'],
              isError && styles['select__trigger_error'],
              triggerClassName,
            )}
            aria-label={label ? undefined : placeholder}
            aria-invalid={isError || undefined}
            aria-describedby={isError ? errorId : undefined}
          >
            <SelectPrimitive.Value asChild placeholder={placeholder}>
              <span className={styles['select__value']}>
                {selectedOption?.image ? (
                  <span className={styles['select__adornment']}>
                    <SelectOptionImage src={selectedOption.image} alt={selectedOption.imageAlt} />
                  </span>
                ) : null}
                <span>{selectedOption?.label ?? placeholder}</span>
              </span>
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <ChevronDownIcon className={styles['select__icon']} aria-hidden />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={styles['select__content']}
              position="popper"
              sideOffset={0}
              align="start"
            >
              <SelectPrimitive.Viewport className={styles['select__viewport']}>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    image={option.image}
                    imageAlt={option.imageAlt}
                    label={option.label}
                  />
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {errorMessage ? (
          <span id={errorId} className={styles['select__errorMessage']} role="alert">
            {errorMessage}
          </span>
        ) : null}
      </div>
    )
  },
)

Select.displayName = 'Select'
