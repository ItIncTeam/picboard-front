import { defaultLanguage, type Language } from '@/shared/lib/i18n'

export type RelativePostTimeLabels = {
  justNow: string
  recently: string
}

const relativeTimeFallbacks: Record<Language, RelativePostTimeLabels> = {
  en: {
    justNow: 'Just now',
    recently: 'Recently',
  },
  ru: {
    justNow: 'Только что',
    recently: 'Недавно',
  },
}

export function formatRelativePostTime(
  createdAt: string,
  now = new Date(),
  language: Language = defaultLanguage,
  labels: RelativePostTimeLabels = relativeTimeFallbacks[language],
): string {
  const createdAtDate = new Date(createdAt)
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  const absoluteDateFormatter = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (Number.isNaN(createdAtDate.getTime())) {
    return labels.recently
  }

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / 1000))

  if (elapsedSeconds < 60) {
    return labels.justNow
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  if (elapsedMinutes < 60) {
    return relativeTimeFormatter.format(-elapsedMinutes, 'minute')
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return relativeTimeFormatter.format(-elapsedHours, 'hour')
  }

  const elapsedDays = Math.floor(elapsedHours / 24)

  if (elapsedDays <= 30) {
    return relativeTimeFormatter.format(-elapsedDays, 'day')
  }

  return absoluteDateFormatter.format(createdAtDate)
}
