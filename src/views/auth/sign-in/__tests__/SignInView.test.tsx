import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignInView } from '../SignInView'

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.push,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('@/features/auth', () => ({
  OAuthProviders: () => null,
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button onClick={onSuccess} type="button">
      Sign in
    </button>
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderSignInView(searchParams: URLSearchParams): RenderResult {
  navigationMocks.searchParams = searchParams

  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<SignInView />)
  })

  return { container, root }
}

describe('SignInView', () => {
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
    navigationMocks.push.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
  })

  it('redirects to a safe returnTo path after sign in', () => {
    const view = renderSignInView(new URLSearchParams({ returnTo: '/feed?sort=recent' }))

    mountedRoots.push(view)

    const signInButton = view.container.querySelector('button')

    act(() => {
      signInButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(navigationMocks.push).toHaveBeenCalledWith('/feed?sort=recent')
  })

  it.each(['https://example.com', '//example.com', '/auth/sign-up'])(
    'falls back to main after sign in when returnTo is unsafe: %s',
    (returnTo) => {
      const view = renderSignInView(new URLSearchParams({ returnTo }))

      mountedRoots.push(view)

      const signInButton = view.container.querySelector('button')

      act(() => {
        signInButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(navigationMocks.push).toHaveBeenCalledWith('/main')
    },
  )
})
