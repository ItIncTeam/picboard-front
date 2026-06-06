'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/lib/cn'

import { SelectOptionImage } from './SelectOptionImage'
import styles from './select.module.css'

export type SelectItemProps = {
  className?: string
  image?: string
  imageAlt?: string
  label: string
} & ComponentPropsWithoutRef<typeof SelectPrimitive.Item>

export const SelectItem = ({ className, image, imageAlt, label, ...props }: SelectItemProps) => {
  return (
    <SelectPrimitive.Item className={cn(styles['select__item'], className)} {...props}>
      <span className={styles['select__itemContent']}>
        {image ? <SelectOptionImage src={image} alt={imageAlt} /> : null}
        <SelectPrimitive.ItemText className={styles['select__itemText']}>
          {label}
        </SelectPrimitive.ItemText>
      </span>
    </SelectPrimitive.Item>
  )
}
