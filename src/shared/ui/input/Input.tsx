'use client'

import type { ComponentPropsWithoutRef } from 'react'
import React, { useId, useState } from 'react'
import s from './Input.module.css'
import clsx from 'clsx'
import { Slot } from '@radix-ui/react-slot'
import SearchIcon from '@/shared/assets/icon/search.svg'

type Props = {
  variant?: 'default' | 'defaultIcon' | 'search'
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>
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
  onClick,
  onKeyUp,
  onMouseDown,
  onBlur,
  disabled,
  placeholder = ' ',
  ...rest
}: Props) => {
  const baseId = useId()
  const [isKeyboardUsed, setIsKeyboardUsed] = useState(false)

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
      id={baseId}
      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab') {
          setIsKeyboardUsed(true)
        }
        onKeyUp?.(e) // Вызов внешнего onKeyUp, если он передан компоненту
      }}
      onMouseDown={(e: React.MouseEvent<HTMLInputElement>) => {
        setIsKeyboardUsed(false)
        onMouseDown?.(e) // Вызов внешнего onMouseDown, если он передан
      }}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        setIsKeyboardUsed(false)
        onBlur?.(e) // Вызов внешнего onBlur, если он передан
      }}
    />
  )
  return (
    <div className={s.root}>
      {label && (
        <label htmlFor={baseId} className={s.label}>
          {label}
        </label>
      )}
      {variant === 'search' && (
        <div className={s.searchWrapper}>
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
      {error && <span className={s.textError}>{error}</span>}
    </div>
  )
}
