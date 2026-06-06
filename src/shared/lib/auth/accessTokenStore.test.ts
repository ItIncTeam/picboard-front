import { afterEach, describe, expect, it } from 'vitest'

import {
  clearAccessToken,
  getAccessToken,
  getTokenVersion,
  setAccessToken,
} from './accessTokenStore'

describe('accessTokenStore', () => {
  afterEach(() => {
    clearAccessToken()
  })

  it('stores token with matching version', () => {
    const currentVersion = getTokenVersion()

    expect(setAccessToken('access-token', currentVersion)).toBe(true)
    expect(getAccessToken()).toBe('access-token')
    expect(getTokenVersion()).toBe(currentVersion)
  })

  it('discards token with mismatched version', () => {
    const staleVersion = getTokenVersion()

    clearAccessToken()

    expect(setAccessToken('access-token', staleVersion)).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it('increments version when token is cleared', () => {
    const previousVersion = getTokenVersion()

    clearAccessToken()

    expect(getTokenVersion()).toBe(previousVersion + 1)
  })

  it('increments version when token is set without guard', () => {
    const previousVersion = getTokenVersion()

    expect(setAccessToken('access-token')).toBe(true)
    expect(getAccessToken()).toBe('access-token')
    expect(getTokenVersion()).toBe(previousVersion + 1)
  })
})
