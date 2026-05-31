import { useId, type ComponentPropsWithoutRef, type ComponentType } from 'react'
import s from './Input.module.css'
import clsx from 'clsx'
import { Slot } from '@radix-ui/react-slot'
import { SearchIcon } from '@/shared/assets'

type Props = {
  variant?: 'default' | 'defaultIcon' | 'search'
  Icon?: ComponentType<ComponentPropsWithoutRef<'svg'>>
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
          <SearchIcon className={s.searchIcn} />
        </div>
      )}
      {variant === 'defaultIcon' && (
        <div className={s.inputWrapper}>
          {inputComponent}
          {Icon && <Icon role="button" onClick={onClick} className={s.defaultIcn} />}
        </div>
      )}
      {variant === 'default' && inputComponent}
      {error && <span className={s.textError}>{error}</span>}
    </div>
  )
}
