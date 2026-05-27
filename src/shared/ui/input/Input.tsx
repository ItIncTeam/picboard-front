import React, { ComponentPropsWithoutRef, useId } from 'react'
import s from './Input.module.css'
import clsx from 'clsx'
import { Slot } from '@radix-ui/react-slot'
import SearchIcon from '@/shared/assets/icon/search.svg'
import Image from 'next/image'
// import path from 'path'

type Props = {
  variant?: 'default' | 'defaultIcon' | 'search'
  icon?: string
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
  icon,
  asChild,
  className,
  label,
  error,
  onClick,
  ...rest
}: Props) => {
  const baseId = useId()

  const Component = asChild ? Slot : 'input'
  const inputComponent = (
    <Component
      className={clsx(s.input, s[variant], error && s.error, className)}
      {...rest}
      id={baseId}
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
          <Image className={s.searchIcn} src={SearchIcon} alt="Search" />
        </div>
      )}
      {variant === 'defaultIcon' && (
        <div className={s.inputWrapper}>
          {inputComponent}
          {icon && (
            <Image role="button" onClick={onClick} className={s.defaultIcn} src={icon} alt="Eye" />
          )}
        </div>
      )}
      {variant === 'default' && inputComponent}
      {error && <span className={s.textError}>{error}</span>}
    </div>
  )
}
