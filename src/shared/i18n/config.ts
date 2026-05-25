export const supportedLocales = ['en', 'ru'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'ru'

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale)
}
