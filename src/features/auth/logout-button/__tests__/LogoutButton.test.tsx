import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoutButton } from '../LogoutButton'

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    logout: sessionMocks.logout,
  }),
}))

vi.mock('@/shared/ui/icon-button', () => ({
  IconButton: ({
    label,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
    <button {...props} aria-label={label} type="button" />
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderLogoutButton(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<LogoutButton />)
  })

  return { container, root }
}

describe('LogoutButton', () => {
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
    sessionMocks.logout.mockReset()
  })

  it('renders an accessible sign out button', () => {
    const view = renderLogoutButton()

    mountedRoots.push(view)

    const button = view.container.querySelector('button[aria-label="Sign out"]')

    expect(button).toBeInstanceOf(HTMLButtonElement)
  })
})
