'use client'

import type { ComponentPropsWithoutRef } from 'react'
import React, { useId, useState } from 'react'
import s from './TextArea.module.css'
import clsx from 'clsx'
import { Slot } from '@radix-ui/react-slot'

type Props = {
  label?: string | null
  error?: string | null
  classNameLabel?: string
  placeholder?: string
  disabled?: boolean
  asChild?: boolean
} & ComponentPropsWithoutRef<'textarea'>

export const TextArea = ({
  asChild,
  className,
  label,
  error,
  onKeyUp,
  onMouseDown,
  onBlur,
  placeholder = ' ',
  ...rest
}: Props) => {
  const baseId = useId()
  const [isKeyboardUsed, setIsKeyboardUsed] = useState(false)

  const Component = asChild ? Slot : 'textarea'

  return (
    <div className={s.root}>
      {label && (
        <label htmlFor={baseId} className={s.label}>
          {label}
        </label>
      )}
      <Component
        placeholder={placeholder}
        className={clsx(
          s.textArea,
          error && s.error,
          isKeyboardUsed && s.keyboardFocused,
          className,
        )}
        {...rest}
        id={baseId}
        onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === 'Tab') {
            setIsKeyboardUsed(true)
          }
          onKeyUp?.(e) // Вызов внешнего onKeyUp, если он передан компоненту
        }}
        onMouseDown={(e: React.MouseEvent<HTMLTextAreaElement>) => {
          setIsKeyboardUsed(false)
          onMouseDown?.(e) // Вызов внешнего onMouseDown, если он передан
        }}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
          setIsKeyboardUsed(false)
          onBlur?.(e) // Вызов внешнего onBlur, если он передан
        }}
      />
      {error && <span className={s.textError}>{error}</span>}
    </div>
  )
}
