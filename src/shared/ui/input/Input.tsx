'use client'

import { Slot } from '@radix-ui/react-slot'
import clsx from 'clsx'
import type {
  ComponentPropsWithoutRef,
  ComponentType,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  SVGProps,
} from 'react'
import { useId, useState } from 'react'

import { SearchIcon } from '@/shared/assets'

import s from './Input.module.css'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type Props = {
  variant?: 'default' | 'defaultIcon' | 'search'
  Icon?: IconComponent
  label?: string | null
  error?: string | null
  classNameLabel?: string
  placeholder?: string
  disabled?: boolean
  asChild?: boolean
  onClick?: () => void
} & ComponentPropsWithoutRef<'input'>

export const Input = ({
  variant = 'default',
  Icon,
  asChild,
  className,
  label,
  error,
  id,
  classNameLabel,
  onClick,
  onKeyUp,
  onMouseDown,
  onBlur,
  disabled,
  placeholder = ' ',
  ...rest
}: Props) => {
  const generatedId = useId()
  const [isKeyboardUsed, setIsKeyboardUsed] = useState(false)
  const inputId = id ?? generatedId
  const helperId = `${inputId}-helper`
  const hasError = Boolean(error)
  const describedBy = clsx(rest['aria-describedby'], helperId)

  const Component = asChild ? Slot : 'input'
  const inputComponent = (
    <Component
      disabled={disabled}
      placeholder={placeholder}
      className={clsx(
        s.input,
        s[variant],
        error && s.error,
        isKeyboardUsed && s.keyboardFocused,
        className,
      )}
      {...rest}
      id={inputId}
      aria-describedby={describedBy}
      aria-invalid={hasError || undefined}
      onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab') {
          setIsKeyboardUsed(true)
        }
        onKeyUp?.(e)
      }}
      onMouseDown={(e: MouseEvent<HTMLInputElement>) => {
        setIsKeyboardUsed(false)
        onMouseDown?.(e)
      }}
      onBlur={(e: FocusEvent<HTMLInputElement>) => {
        setIsKeyboardUsed(false)
        onBlur?.(e)
      }}
    />
  )
  return (
    <div className={s.root}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(s.label, disabled && s.labelDisabled, classNameLabel)}
        >
          {label}
        </label>
      )}
      {variant === 'search' && (
        <div className={clsx(s.searchWrapper, disabled && s.disabled)}>
          {inputComponent}
          <SearchIcon className={s.searchIcn} />
        </div>
      )}
      {variant === 'defaultIcon' && (
        <div className={clsx(s.inputWrapper, disabled && s.disabled)}>
          {inputComponent}
          {Icon && <Icon role="button" onClick={onClick} className={s.defaultIcn} />}
        </div>
      )}
      {variant === 'default' && inputComponent}
      <span
        id={helperId}
        className={clsx(s.helperText, hasError && s.helperTextVisible)}
        role={hasError ? 'alert' : undefined}
        aria-live="polite"
      >
        {error}
      </span>
    </div>
  )
}
