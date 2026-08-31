import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OAuthCallback } from '../OAuthCallback'
import type * as OAuthModule from '@/features/auth/oauth'

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}))

const oauthMocks = vi.hoisted(() => ({
  completeOAuthAuth: vi.fn(),
  errorCode: null as string | null,
  isLoading: false,
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/features/auth/oauth', async () => {
  const actual = await vi.importActual<typeof OAuthModule>('@/features/auth/oauth')

  return {
    ...actual,
    useOAuthAuth: () => ({
      completeOAuthAuth: oauthMocks.completeOAuthAuth,
      errorCode: oauthMocks.errorCode,
      isLoading: oauthMocks.isLoading,
    }),
  }
})

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderOAuthCallback(searchParams: URLSearchParams): RenderResult {
  navigationMocks.searchParams = searchParams

  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<OAuthCallback />)
  })

  return { container, root }
}

describe('OAuthCallback', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => {
        root.unmount()
      })

      container.remove()
    })

    mountedRoots.length = 0
    navigationMocks.searchParams = new URLSearchParams()
    oauthMocks.completeOAuthAuth.mockReset()
    oauthMocks.errorCode = null
    oauthMocks.isLoading = false
  })

  it('starts backend code exchange when callback has code', () => {
    const view = renderOAuthCallback(new URLSearchParams({ code: 'backend-code' }))

    mountedRoots.push(view)

    expect(oauthMocks.completeOAuthAuth).toHaveBeenCalledWith({ code: 'backend-code' })
  })

  it('shows completing state before exchange reports an error', () => {
    const view = renderOAuthCallback(new URLSearchParams({ code: 'backend-code' }))

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Completing sign in')
    expect(view.container.textContent).not.toContain('Something went wrong')
  })

  it('shows missing-code content when hook reports no_code', () => {
    oauthMocks.errorCode = 'no_code'

    const view = renderOAuthCallback(new URLSearchParams())

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Sign-in failed')
    expect(view.container.textContent).toContain(
      'We did not receive a valid sign-in response. Please try again.',
    )
  })

  it.each([
    ['invalid_state', 'Session expired'],
    ['no_code', 'Sign-in failed'],
    ['no_pkce_verifier', 'Sign-in expired'],
    ['unverified_email', 'Email is not verified'],
  ])('shows known OAuth error content for %s', (error, title) => {
    const view = renderOAuthCallback(new URLSearchParams({ error }))

    mountedRoots.push(view)

    expect(view.container.textContent).toContain(title)
    expect(oauthMocks.completeOAuthAuth).not.toHaveBeenCalled()
  })

  it('shows fallback content for unknown OAuth error', () => {
    const view = renderOAuthCallback(new URLSearchParams({ error: 'unexpected_error' }))

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Something went wrong')
    expect(view.container.textContent).toContain('We could not complete Google sign-in.')
    expect(oauthMocks.completeOAuthAuth).not.toHaveBeenCalled()
  })
})
