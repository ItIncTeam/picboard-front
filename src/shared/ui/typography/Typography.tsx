import clsx from 'clsx'
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

import styles from './typography.module.css'

type TypographyOwnProps<TTag extends ElementType> = {
  children: ReactNode
  className?: string
  color?: CSSProperties['color']
  component?: TTag
  mb?: CSSProperties['marginBottom']
  ml?: CSSProperties['marginLeft']
  mr?: CSSProperties['marginRight']
  mt?: CSSProperties['marginTop']
  mx?: CSSProperties['marginLeft']
  my?: CSSProperties['marginTop']
  style?: CSSProperties
}

type TypographyProps<TTag extends ElementType> = TypographyOwnProps<TTag> &
  Omit<ComponentPropsWithoutRef<TTag>, keyof TypographyOwnProps<TTag>>

const createTypographyComponent = <TDefaultTag extends ElementType>(
  variantClassName: keyof typeof styles,
  defaultComponent: TDefaultTag,
) => {
  const TypographyComponent = <TTag extends ElementType = TDefaultTag>({
    children,
    className,
    color,
    component,
    mb,
    ml,
    mr,
    mt,
    mx,
    my,
    style,
    ...rest
  }: TypographyProps<TTag>) => {
    const Component: ElementType = component ?? defaultComponent

    const classNames = clsx(styles.root, styles[variantClassName], className)

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
      <Component className={classNames} style={inlineStyles} {...rest}>
        {children}
      </Component>
    )
  }

  TypographyComponent.displayName = `Typography.${String(variantClassName)}`

  return TypographyComponent
}

export const Typography = {
  BoldText14: createTypographyComponent('boldText14', 'p'),
  BoldText16: createTypographyComponent('boldText16', 'p'),
  H1: createTypographyComponent('h1', 'h1'),
  H2: createTypographyComponent('h2', 'h2'),
  H3: createTypographyComponent('h3', 'h3'),
  Large: createTypographyComponent('large', 'p'),
  MediumText14: createTypographyComponent('mediumText14', 'p'),
  RegularLink: createTypographyComponent('regularLink', 'a'),
  RegularText14: createTypographyComponent('regularText14', 'p'),
  RegularText16: createTypographyComponent('regularText16', 'p'),
  SemiBoldSmallText: createTypographyComponent('semiBoldSmallText', 'span'),
  SmallLink: createTypographyComponent('smallLink', 'a'),
  SmallText: createTypographyComponent('smallText', 'span'),
}
