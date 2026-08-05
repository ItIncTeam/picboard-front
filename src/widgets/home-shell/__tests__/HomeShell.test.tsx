import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomeShell } from '../HomeShell'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const sessionState = vi.hoisted(() => ({
  isAuthenticated: false,
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => sessionState,
}))

vi.mock('@/widgets/app-header', () => ({
  AppHeader: () => <header aria-label="Authenticated header">Authenticated header</header>,
}))

vi.mock('@/widgets/public-header', () => ({
  PublicHeader: () => <header aria-label="Public header">Public header</header>,
}))

vi.mock('@/widgets/sidebar', () => ({
  Sidebar: () => <aside aria-label="Authenticated sidebar">Authenticated sidebar</aside>,
}))

function renderHomeShell(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <HomeShell>
        <section aria-label="Public posts">Public posts content</section>
      </HomeShell>,
    )
  })

  return { container, root }
}

describe('HomeShell', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    sessionState.isAuthenticated = false
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

  it('renders public chrome and server-provided content for anonymous users', () => {
    const view = renderHomeShell()

    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label="Public header"]')).toBeInstanceOf(HTMLElement)
    expect(view.container.querySelector('[aria-label="Authenticated header"]')).toBeNull()
    expect(view.container.querySelector('[aria-label="Authenticated sidebar"]')).toBeNull()
    expect(view.container.querySelector('[aria-label="Public posts"]')?.textContent).toBe(
      'Public posts content',
    )
  })

  it('renders authenticated chrome and keeps server-provided content for authenticated users', () => {
    sessionState.isAuthenticated = true

    const view = renderHomeShell()

    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label="Authenticated header"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.querySelector('[aria-label="Authenticated sidebar"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.querySelector('[aria-label="Public header"]')).toBeNull()
    expect(view.container.querySelector('[aria-label="Public posts"]')?.textContent).toBe(
      'Public posts content',
    )
  })
})
