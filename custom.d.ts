declare module '*.svg?react' {
  import type * as React from 'react'

  type SvgProps = React.ComponentProps<'svg'> & {
    title?: string
    titleId?: string
    desc?: string
    descId?: string
  }

  const SvgComponent: (props: SvgProps) => React.ReactElement

  export default SvgComponent
}
