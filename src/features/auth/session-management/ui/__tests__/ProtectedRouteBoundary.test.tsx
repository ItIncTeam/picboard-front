import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProtectedRouteBoundary } from '../ProtectedRouteBoundary'

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  status: 'bootstrapping' as 'anonymous' | 'authenticated' | 'bootstrapping',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
}))

vi.mock('../../model/useSession', () => ({
  useSession: () => ({
    status: sessionMocks.status,
  }),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderProtectedRouteBoundary(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <ProtectedRouteBoundary>
        <div>Protected content</div>
      </ProtectedRouteBoundary>,
    )
  })

  return { container, root }
}

describe('ProtectedRouteBoundary', () => {
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
    navigationMocks.replace.mockReset()
    sessionMocks.status = 'bootstrapping'
    window.history.pushState({}, '', '/')
  })

  it('shows loading state while bootstrapping', () => {
    sessionMocks.status = 'bootstrapping'

    const view = renderProtectedRouteBoundary()

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Loading session...')
    expect(view.container.textContent).not.toContain('Protected content')
  })

  it('redirects anonymous users to sign in', () => {
    window.history.pushState({}, '', '/feed')
    sessionMocks.status = 'anonymous'

    const view = renderProtectedRouteBoundary()

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Redirecting to sign in...')
    expect(navigationMocks.replace).toHaveBeenCalledWith('/auth/sign-in?returnTo=%2Ffeed')
  })

  it('preserves protected route query params in returnTo', () => {
    window.history.pushState({}, '', '/search?term=user&sort=recent')
    sessionMocks.status = 'anonymous'

    const view = renderProtectedRouteBoundary()

    mountedRoots.push(view)

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      '/auth/sign-in?returnTo=%2Fsearch%3Fterm%3Duser%26sort%3Drecent',
    )
  })
})
