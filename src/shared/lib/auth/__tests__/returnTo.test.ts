import { describe, expect, it } from 'vitest'

import { getSafeReturnToPath } from '../returnTo'

describe('getSafeReturnToPath', () => {
  it('allows an internal profile path', () => {
    expect(getSafeReturnToPath('/profile/user-id')).toBe('/profile/user-id')
  })

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example'])(
    'falls back to main for an unsafe returnTo: %s',
    (returnTo) => {
      expect(getSafeReturnToPath(returnTo)).toBe('/main')
    },
  )

  it('falls back to main for an encoded backslash path from URLSearchParams', () => {
    const returnTo = new URLSearchParams('returnTo=%2F%5C%5Cevil.example').get('returnTo')

    expect(getSafeReturnToPath(returnTo)).toBe('/main')
  })
})
