export const languages = {
  en: 'en',
  ru: 'ru',
} as const

export type Language = (typeof languages)[keyof typeof languages]

export const defaultLanguage: Language = languages.en

export const isLanguage = (value: string): value is Language => {
  return Object.values(languages).includes(value as Language)
}
