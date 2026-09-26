import { describe, expect, it } from 'vitest'

import { getSafeCreatePostCloseHref } from './createPostCloseRoute'

describe('getSafeCreatePostCloseHref', () => {
  it('returns null when previous pathname is unknown', () => {
    expect(getSafeCreatePostCloseHref(null)).toBeNull()
  })

  it('returns null for auth root route', () => {
    expect(getSafeCreatePostCloseHref('/auth')).toBeNull()
  })

  it('returns null for nested auth routes', () => {
    expect(getSafeCreatePostCloseHref('/auth/sign-in')).toBeNull()
  })

  it('returns null for create post route', () => {
    expect(getSafeCreatePostCloseHref('/posts/create')).toBeNull()
  })

  it.each(['/main', '/feed', '/search', '/favorites', '/statistics'])(
    'returns safe exact pathname %s',
    (pathname) => {
      expect(getSafeCreatePostCloseHref(pathname)).toBe(pathname)
    },
  )

  it.each(['/profile/1', '/posts/123', '/settings/profile'])(
    'returns safe nested pathname %s',
    (pathname) => {
      expect(getSafeCreatePostCloseHref(pathname)).toBe(pathname)
    },
  )

  it('returns null for unsupported previous pathname', () => {
    expect(getSafeCreatePostCloseHref('/admin/users')).toBeNull()
  })
})
