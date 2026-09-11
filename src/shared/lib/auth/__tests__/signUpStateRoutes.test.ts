import { describe, expect, it } from 'vitest'

import { getSignUpConfirmedHref, getSignUpExpiredHref } from '../signUpStateRoutes'

describe('signUpStateRoutes', () => {
  it('builds confirmed sign-up href', () => {
    expect(getSignUpConfirmedHref()).toBe('/auth/sign-up?status=confirmed')
  })

  it('builds expired sign-up href without email', () => {
    expect(getSignUpExpiredHref()).toBe('/auth/sign-up?status=expired')
  })

  it('builds expired sign-up href with email', () => {
    expect(getSignUpExpiredHref(' user@example.com ')).toBe(
      '/auth/sign-up?status=expired&email=user%40example.com',
    )
  })
})
