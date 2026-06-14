import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSignUpConfirmedHref, getSignUpExpiredHref } from '@/shared/lib/auth'

import { ConfirmRegistrationView } from '../ConfirmRegistrationView'

const apiMocks = vi.hoisted(() => ({
  emailConfirmation: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('@/features/auth/confirm-registration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/confirm-registration')>()

  return {
    ...actual,
    emailConfirmation: apiMocks.emailConfirmation,
  }
})

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
    root.render(<ConfirmRegistrationView />)
  })

  return { container, root }
}

describe('ConfirmRegistrationView', () => {
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
    apiMocks.emailConfirmation.mockReset()
    navigationMocks.replace.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
  })

  it('shows loading state while confirming a registration code', () => {
    apiMocks.emailConfirmation.mockReturnValue(new Promise(() => undefined))

    const view = renderView(new URLSearchParams({ code: 'confirmation-code' }))

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Verifying your confirmation link...')
  })

  it('redirects to confirmed sign-up state after successful confirmation', async () => {
    apiMocks.emailConfirmation.mockResolvedValueOnce({ message: 'Email confirmed' })

    const view = renderView(new URLSearchParams({ code: 'confirmation-code' }))

    mountedRoots.push(view)

    await act(async () => {
      await Promise.resolve()
    })

    expect(apiMocks.emailConfirmation).toHaveBeenCalledWith({ code: 'confirmation-code' })
    expect(navigationMocks.replace).toHaveBeenCalledWith(getSignUpConfirmedHref())
  })

  it('redirects to confirmed sign-up state when email is already confirmed', async () => {
    apiMocks.emailConfirmation.mockRejectedValueOnce(new Error('Email already confirmed'))

    const view = renderView(new URLSearchParams({ code: 'confirmation-code' }))

    mountedRoots.push(view)

    await act(async () => {
      await Promise.resolve()
    })

    expect(navigationMocks.replace).toHaveBeenCalledWith(getSignUpConfirmedHref())
  })

  it('redirects to expired sign-up state for invalid confirmation codes', async () => {
    apiMocks.emailConfirmation.mockRejectedValueOnce(new Error('Invalid confirmation code'))

    const view = renderView(new URLSearchParams({ code: 'confirmation-code' }))

    mountedRoots.push(view)

    await act(async () => {
      await Promise.resolve()
    })

    expect(navigationMocks.replace).toHaveBeenCalledWith(getSignUpExpiredHref())
  })

  it('redirects to expired sign-up state when code is missing', () => {
    const view = renderView(new URLSearchParams())

    mountedRoots.push(view)

    expect(navigationMocks.replace).toHaveBeenCalledWith(getSignUpExpiredHref())
    expect(apiMocks.emailConfirmation).not.toHaveBeenCalled()
  })

  it('shows resend link for unknown confirmation errors', async () => {
    apiMocks.emailConfirmation.mockRejectedValueOnce(new Error('Failed to fetch'))

    const view = renderView(new URLSearchParams({ code: 'confirmation-code' }))

    mountedRoots.push(view)

    await act(async () => {
      await Promise.resolve()
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain('Failed to fetch')

    const link = view.container.querySelector('a')

    expect(link?.getAttribute('href')).toBe(getSignUpExpiredHref())
    expect(link?.textContent).toContain('Request a new verification link')
  })
})
