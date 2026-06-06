import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authRoutes } from '@/shared/lib/auth'

import ConfirmPasswordRecoveryView from '../ConfirmPasswordRecoveryView'

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderView(searchParams: URLSearchParams): RenderResult {
  navigationMocks.searchParams = searchParams

  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<ConfirmPasswordRecoveryView />)
  })

  return { container, root }
}

describe('ConfirmPasswordRecoveryView', () => {
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
    navigationMocks.searchParams = new URLSearchParams()
  })

  it('shows loading state while redirecting with a recovery code', () => {
    const view = renderView(new URLSearchParams({ code: 'recovery-code' }))

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Verifying your recovery link...')
  })

  it('redirects to create new password when code is present', () => {
    const view = renderView(new URLSearchParams({ code: 'code with spaces' }))

    mountedRoots.push(view)

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      `${authRoutes.createNewPassword}?code=code%20with%20spaces`,
    )
  })

  it('shows error and forgot-password link when code is missing', () => {
    const view = renderView(new URLSearchParams())

    mountedRoots.push(view)

    expect(view.container.textContent).toContain(
      'Invalid recovery link. Please request a new password reset.',
    )

    const link = view.container.querySelector('a')

    expect(link?.getAttribute('href')).toBe(authRoutes.forgotPassword)
    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })
})
