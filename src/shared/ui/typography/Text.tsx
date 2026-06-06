import { clsx as cn } from 'clsx'
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

import styles from './typography.module.css'

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold'

type TextOwnProps<TTag extends ElementType> = {
  as?: TTag
  children: ReactNode
  className?: string
  color?: CSSProperties['color']
  mb?: CSSProperties['marginBottom']
  ml?: CSSProperties['marginLeft']
  mr?: CSSProperties['marginRight']
  mt?: CSSProperties['marginTop']
  mx?: CSSProperties['marginLeft']
  my?: CSSProperties['marginTop']
  size?: TextSize
  style?: CSSProperties
  weight?: TextWeight
}

export type TextProps<TTag extends ElementType = 'p'> = TextOwnProps<TTag> &
  Omit<ComponentPropsWithoutRef<TTag>, keyof TextOwnProps<TTag>>

export const Text = <TTag extends ElementType = 'p'>({
  as,
  children,
  className,
  color,
  mb,
  ml,
  mr,
  mt,
  mx,
  my,
  size = 'md',
  style,
  weight = 'regular',
  ...rest
}: TextProps<TTag>) => {
  const Component = as ?? 'p'

  const inlineStyles: CSSProperties = {
    ...(mx !== undefined && { marginLeft: mx, marginRight: mx }),
    ...(my !== undefined && { marginTop: my, marginBottom: my }),
    ...(mr !== undefined && { marginRight: mr }),
    ...(ml !== undefined && { marginLeft: ml }),
    ...(mt !== undefined && { marginTop: mt }),
    ...(mb !== undefined && { marginBottom: mb }),
    ...(color !== undefined && { color }),
    ...style,
  }

  return (
    <Component
      className={cn(styles.root, styles[size], styles[weight], className)}
      style={inlineStyles}
      {...rest}
    >
      {children}
    </Component>
  )
}
