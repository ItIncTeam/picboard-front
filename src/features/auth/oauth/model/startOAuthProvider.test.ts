import { describe, expect, it } from 'vitest'

import { oauthStartUrls } from './startOAuthProvider'

describe('oauthStartUrls', () => {
  it('uses backend-owned OAuth start URLs', () => {
    expect(oauthStartUrls.google).toBe('https://users.picboard.space/api/v1/auth/google/start')
    expect(oauthStartUrls.github).toBe('https://users.picboard.space/api/v1/auth/github/login')
  })
})
