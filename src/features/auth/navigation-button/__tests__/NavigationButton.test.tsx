import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NavigationButton } from '@/features/auth'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, className, href }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={className} href={String(href)}>
      {children}
    </a>
  ),
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => children,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderNavigationButton(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<NavigationButton />)
  })

  return { container, root }
}

describe('NavigationButton', () => {
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
  })

  it('renders auth navigation links with correct hrefs', () => {
    const view = renderNavigationButton()

    mountedRoots.push(view)

    const signInLink = Array.from(view.container.querySelectorAll('a')).find(
      (link) => link.textContent === 'Log in',
    )
    const signUpLink = Array.from(view.container.querySelectorAll('a')).find(
      (link) => link.textContent === 'Sign up',
    )

    expect(signInLink?.getAttribute('href')).toBe('/auth/sign-in')
    expect(signUpLink?.getAttribute('href')).toBe('/auth/sign-up')
  })
})
