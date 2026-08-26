import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileRouteShell } from '../ProfileRouteShell'

const sessionMocks = vi.hoisted(() => ({
  status: 'bootstrapping' as 'anonymous' | 'authenticated' | 'bootstrapping',
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({ status: sessionMocks.status }),
}))

vi.mock('@/widgets/app-header', () => ({
  AppHeader: () => <header>Authenticated Header</header>,
}))

vi.mock('@/widgets/public-header', () => ({
  PublicHeader: () => <header>Public Header</header>,
}))

vi.mock('@/widgets/sidebar', () => ({
  Sidebar: () => <aside>Sidebar</aside>,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderShell(): RenderResult & { rerender: () => void } {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  const rerender = () => {
    act(() => {
      root.render(
        <ProfileRouteShell>
          <p>Public profile content</p>
        </ProfileRouteShell>,
      )
    })
  }

  rerender()

  return { container, rerender, root }
}

describe('ProfileRouteShell', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    sessionMocks.status = 'bootstrapping'
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('keeps profile content while selecting the shell after session bootstrap', () => {
    const view = renderShell()
    mountedRoots.push(view)

    const profileContent = view.container.querySelector('p')

    expect(view.container.textContent).toContain('Public profile content')
    expect(view.container.textContent).not.toContain('Public Header')
    expect(view.container.textContent).not.toContain('Authenticated Header')
    expect(view.container.textContent).not.toContain('Sidebar')

    sessionMocks.status = 'anonymous'
    view.rerender()

    expect(view.container.textContent).toContain('Public Header')
    expect(view.container.textContent).not.toContain('Authenticated Header')
    expect(view.container.querySelector('p')).toBe(profileContent)

    sessionMocks.status = 'authenticated'
    view.rerender()

    expect(view.container.textContent).not.toContain('Public Header')
    expect(view.container.textContent).toContain('Authenticated Header')
    expect(view.container.textContent).toContain('Sidebar')
    expect(view.container.querySelector('p')).toBe(profileContent)
  })
})
