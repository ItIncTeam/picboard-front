const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const absoluteDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatRelativePostTime(createdAt: string, now = new Date()): string {
  const createdAtDate = new Date(createdAt)

  if (Number.isNaN(createdAtDate.getTime())) {
    return 'Recently'
  }

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / 1000))

  if (elapsedSeconds < 60) {
    return 'Just now'
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
