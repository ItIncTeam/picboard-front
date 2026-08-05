import { describe, expect, it } from 'vitest'

import { formatRelativePostTime } from './formatRelativePostTime'

const now = new Date('2026-08-05T12:00:00.000Z')

describe('formatRelativePostTime', () => {
  it.each([
    ['2026-08-05T11:59:30.000Z', 'Just now'],
    ['2026-08-05T11:38:00.000Z', '22 minutes ago'],
    ['2026-08-05T09:00:00.000Z', '3 hours ago'],
    ['2026-08-03T12:00:00.000Z', '2 days ago'],
  ])('formats %s as %s', (createdAt, expected) => {
    expect(formatRelativePostTime(createdAt, now)).toBe(expected)
  })

  it('uses a stable fallback for invalid dates', () => {
    expect(formatRelativePostTime('invalid', now)).toBe('Recently')
  })
})
