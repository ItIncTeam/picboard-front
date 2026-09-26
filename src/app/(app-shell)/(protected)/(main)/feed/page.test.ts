import { describe, expect, it, vi } from 'vitest'

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: navigationMocks.redirect,
}))

import Page from './page'

describe('/feed compatibility route', () => {
  it('redirects to the canonical authenticated home', () => {
    Page()

    expect(navigationMocks.redirect).toHaveBeenCalledWith('/main')
  })
})
