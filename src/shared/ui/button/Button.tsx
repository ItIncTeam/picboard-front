import { cloneElement, isValidElement, type ComponentPropsWithoutRef, type MouseEvent } from 'react'
import s from './button.module.css'
import clsx from 'clsx'
import { Slot, Slottable } from '@radix-ui/react-slot'

type Props = {
  variant?: 'primary' | 'secondary' | 'outlined' | 'textButton'
  asChild?: boolean
  loading?: boolean
  loadingText?: string
} & ComponentPropsWithoutRef<'button'>

export const Button = ({
  variant = 'primary',
  asChild,
  children,
  className,
  disabled,
  loading = false,
  loadingText,
  onClick,
  ...rest
}: Props) => {
  const Component = asChild ? Slot : 'button'
  const isDisabled = disabled || loading
  const disabledProps = asChild
    ? {
        'aria-disabled': isDisabled || undefined,
        'data-disabled': isDisabled ? '' : undefined,
      }
    : {
        disabled: isDisabled,
      }
  const content = loading && loadingText && !asChild ? loadingText : children
  const slottableContent =
    loading && loadingText && isValidElement(children)
      ? cloneElement(children, undefined, loadingText)
      : children
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onClick?.(event)
  }

  return (
    <Component
      {...rest}
      {...disabledProps}
      aria-busy={loading || undefined}
      className={clsx(s.button, s[variant], className)}
      onClick={handleClick}
    >
      {loading && <ButtonSpinner />}
      {asChild ? <Slottable>{slottableContent}</Slottable> : content}
    </Component>
  )
}

function ButtonSpinner() {
  return (
    <svg
      aria-hidden="true"
      className={s.spinner}
      focusable="false"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" fill="none" opacity=".25" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}
