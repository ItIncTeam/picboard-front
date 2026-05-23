import selectStyles from './select.module.css'

export { Select } from './Select'
export type { SelectProps } from './Select'
export { SelectItem } from './SelectItem'
export type { SelectItemProps } from './SelectItem'

/** Figma header Language: `--select-width: 163px` + light value text (see `.rootHeader`). */
export const selectHeaderRootClassName = selectStyles.rootHeader
