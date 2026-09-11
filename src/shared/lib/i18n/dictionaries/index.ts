import { en } from './en'
import { ru } from './ru'
import { type Language } from '../languages'

type WidenDictionary<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : WidenDictionary<T[Key]>
}

export type Dictionary = WidenDictionary<typeof en>

export const dictionaries = {
  en,
  ru,
} satisfies Record<Language, Dictionary>
