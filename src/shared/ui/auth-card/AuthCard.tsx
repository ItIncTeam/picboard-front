import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './auth-card.module.css'

const DEFAULT_GAP = 14

type AuthCardProps = {
  children: ReactNode
  className?: string
  gap?: number
}

export function AuthCard({ children, className, gap }: AuthCardProps) {
  const cardStyle: CSSProperties = { gap: gap ?? DEFAULT_GAP }

  return (
    <div className={cn(styles.card, className)} style={cardStyle}>
      {children}
    </div>
  )
}
