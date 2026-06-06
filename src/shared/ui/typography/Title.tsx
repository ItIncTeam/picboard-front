import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react'

import { clsx as cn } from 'clsx'
import styles from './typography.module.css'

type TitleLevel = 'h1' | 'h2' | 'h3'

type TitleProps = {
  children: ReactNode
  className?: string
  color?: CSSProperties['color']
  level?: TitleLevel
  mb?: CSSProperties['marginBottom']
  ml?: CSSProperties['marginLeft']
  mr?: CSSProperties['marginRight']
  mt?: CSSProperties['marginTop']
  mx?: CSSProperties['marginLeft']
  my?: CSSProperties['marginTop']
  style?: CSSProperties
} & Omit<ComponentPropsWithoutRef<'h1'>, 'children' | 'className' | 'style'>

export const Title = ({
  children,
  className,
  color,
  level = 'h2',
  mb,
  ml,
  mr,
  mt,
  mx,
  my,
  style,
  ...rest
}: TitleProps) => {
  const Component = level

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
    <Component className={cn(styles.root, styles[level], className)} style={inlineStyles} {...rest}>
      {children}
    </Component>
  )
}
