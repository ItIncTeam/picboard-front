import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import { I18nProvider } from '@/shared/lib/i18n'

import { Header } from '../Header'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img alt={alt} src={src} />
  ),
}))

vi.mock('@/shared/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactElement }) => children,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderHeader(role: 'guest' | 'user'): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <Header role={role} />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('Header', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('renders public actions without a notifications control for guests', () => {
    const view = renderHeader('guest')
    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label*="Notifications"]')).toBeNull()
    expect(view.container.querySelector('[aria-label="Select language"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.textContent).toContain('Log in')
    expect(view.container.textContent).toContain('Sign up')
  })

  it('keeps notifications and language controls for authenticated users', () => {
    const view = renderHeader('user')
    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label*="Notifications"]')).toBeInstanceOf(
      HTMLButtonElement,
    )
    expect(view.container.querySelector('[aria-label="Select language"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.textContent).not.toContain('Log in')
    expect(view.container.textContent).not.toContain('Sign up')
  })
})
