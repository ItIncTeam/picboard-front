import { type AnchorHTMLAttributes, type CSSProperties, type ReactNode } from 'react'

import { clsx as cn } from 'clsx'
import styles from './typography.module.css'

type LinkSize = 'xs' | 'sm' | 'md'

type LinkProps = {
  children: ReactNode
  className?: string
  mb?: CSSProperties['marginBottom']
  ml?: CSSProperties['marginLeft']
  mr?: CSSProperties['marginRight']
  mt?: CSSProperties['marginTop']
  mx?: CSSProperties['marginLeft']
  my?: CSSProperties['marginTop']
  size?: LinkSize
  style?: CSSProperties
} & AnchorHTMLAttributes<HTMLAnchorElement>

export const Link = ({
  children,
  className,
  mb,
  ml,
  mr,
  mt,
  mx,
  my,
  size = 'md',
  style,
  ...rest
}: LinkProps) => {
  const inlineStyles: CSSProperties = {
    ...(mx !== undefined && { marginLeft: mx, marginRight: mx }),
    ...(my !== undefined && { marginTop: my, marginBottom: my }),
    ...(mr !== undefined && { marginRight: mr }),
    ...(ml !== undefined && { marginLeft: ml }),
    ...(mt !== undefined && { marginTop: mt }),
    ...(mb !== undefined && { marginBottom: mb }),
    ...style,
  }

  return (
    <a
      className={cn(styles.root, styles[size], styles.regular, styles.link, className)}
      style={inlineStyles}
      {...rest}
    >
      {children}
    </a>
  )
}
