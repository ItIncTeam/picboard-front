import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/widgets/header', () => ({
  Header: ({ role }: { role: string }) => <header data-role={role}>PublicHeader</header>,
}))

vi.mock('@/widgets/app-header', () => ({
  AppHeader: () => <header data-testid="app-header">AppHeader</header>,
}))

vi.mock('@/widgets/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

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

import { I18nProvider } from '@/shared/lib/i18n'
import { PublicHomeContent } from '@/views/public-home-page/PublicHomePage'
import PublicLayout from '../layout'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

describe('Public route layout composition', () => {
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

  it('renders Public Home under PublicHeader without protected chrome', () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)

    act(() => {
      root.render(
        <I18nProvider>
          <PublicLayout>
            <PublicHomeContent data={{ posts: [], usersCount: 0 }} />
          </PublicLayout>
        </I18nProvider>,
      )
    })
    mountedRoots.push({ container, root })

    expect(container.querySelector('header[data-role="guest"]')?.textContent).toBe('PublicHeader')
    expect(container.textContent).toContain('Latest public posts')
    expect(container.textContent).toContain('Registered users:')
    expect(container.querySelector('[data-testid="sidebar"]')).toBeNull()
    expect(container.querySelector('[data-testid="app-header"]')).toBeNull()
  })
})
