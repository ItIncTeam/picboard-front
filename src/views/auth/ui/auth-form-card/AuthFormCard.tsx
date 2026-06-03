import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './auth-form-card.module.css'

const DEFAULT_GAP = 14

type AuthFormCardProps = {
  children: ReactNode
  className?: string
  gap?: number
}

export function AuthFormCard({ children, className, gap = DEFAULT_GAP }: AuthFormCardProps) {
  return (
    <div className={cn(styles.card, className)} style={{ gap: `${gap}px` }}>
      {children}
    </div>
  )
}
