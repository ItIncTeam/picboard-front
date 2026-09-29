import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { SettingsNavigation } from '../SettingsNavigation'

const navigationMocks = vi.hoisted(() => ({
  pathname: '/settings/profile',
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderNavigation(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(
      <I18nProvider>
        <SettingsNavigation />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('SettingsNavigation', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    navigationMocks.pathname = '/settings/profile'
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('renders links for existing settings routes and marks the current route', () => {
    const view = renderNavigation()
    mountedRoots.push(view)

    const links = Array.from(view.container.querySelectorAll('a'))

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/settings/profile',
      '/settings/devices',
      '/settings/account',
      '/settings/notifications',
    ])
    expect(links[0]?.getAttribute('aria-current')).toBe('page')
    expect(links.slice(1).every((link) => link.getAttribute('aria-current') === null)).toBe(true)
  })
})
