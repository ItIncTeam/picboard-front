'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { useId, type ComponentPropsWithoutRef } from 'react'

import styles from './radio-group.module.css'

export type RadioGroupItemProps = {
  label?: string
  className?: string
  labelClassName?: string
} & ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>

const joinClassNames = (...classNames: Array<string | undefined>) => {
  return classNames.filter(Boolean).join(' ')
}

export const RadioGroupItem = ({
  label,
  className,
  labelClassName,
  id,
  disabled,
  value,
  ...props
}: RadioGroupItemProps) => {
  const generatedId = useId()
  const itemId = id ?? generatedId
  const rootClassName = joinClassNames(styles.root, className)
  const control = (
    <RadioGroupPrimitive.Item
      id={itemId}
      className={styles.control}
      disabled={disabled}
      value={value}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className={styles.indicator} />
    </RadioGroupPrimitive.Item>
  )

  if (!label) {
    return <div className={rootClassName}>{control}</div>
  }

  return (
    <label className={rootClassName} htmlFor={itemId}>
      {control}
      <span className={joinClassNames(styles.label, labelClassName)}>{label}</span>
    </label>
  )
}
