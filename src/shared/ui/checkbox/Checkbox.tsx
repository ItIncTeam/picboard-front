'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { useId, type ComponentPropsWithoutRef } from 'react'

import styles from './checkbox.module.css'

export type CheckboxProps = {
  label?: string
  className?: string
  labelClassName?: string
} & ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

const joinClassNames = (...classNames: Array<string | undefined>) => {
  return classNames.filter(Boolean).join(' ')
}

export const Checkbox = ({
  label,
  className,
  labelClassName,
  id,
  disabled,
  ...props
}: CheckboxProps) => {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const rootClassName = joinClassNames(styles.root, className)
  const control = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      className={styles.control}
      disabled={disabled}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={styles.indicator}>
        <CheckIcon className={styles.checkIcon} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!label) {
    return <div className={rootClassName}>{control}</div>
  }

  return (
    <label className={rootClassName} htmlFor={checkboxId}>
      {control}
      <span className={joinClassNames(styles.label, labelClassName)}>{label}</span>
    </label>
  )
}
