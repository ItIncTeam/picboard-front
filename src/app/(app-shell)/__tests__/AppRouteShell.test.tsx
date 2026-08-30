import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppRouteShell } from '../AppRouteShell'

const shellMocks = vi.hoisted(() => ({
  sidebarMounts: 0,
  sidebarUnmounts: 0,
  sidebarOpenStates: [] as boolean[],
  status: 'authenticated' as 'anonymous' | 'authenticated' | 'bootstrapping',
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({ status: shellMocks.status }),
}))

vi.mock('@/widgets/app-header', () => ({
  AppHeader: () => <header>Authenticated Header</header>,
}))

vi.mock('@/widgets/public-header', () => ({
  PublicHeader: () => <header>Public Header</header>,
}))

vi.mock('@/widgets/sidebar', async () => {
  const { useEffect } = await import('react')

  return {
    Sidebar: ({ isOpen }: { isOpen: boolean }) => {
      shellMocks.sidebarOpenStates.push(isOpen)

      useEffect(() => {
        shellMocks.sidebarMounts += 1

        return () => {
          shellMocks.sidebarUnmounts += 1
        }
      }, [])

      return <aside data-open={String(isOpen)}>Sidebar</aside>
    },
  }
})

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderRoute(root: Root, route: string) {
  act(() => {
    root.render(
      <AppRouteShell>
        <p data-route={route}>{route}</p>
      </AppRouteShell>,
    )
  })
}

describe('AppRouteShell', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    shellMocks.sidebarMounts = 0
    shellMocks.sidebarUnmounts = 0
    shellMocks.sidebarOpenStates.length = 0
    shellMocks.status = 'authenticated'
    window.localStorage.clear()
    window.matchMedia = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    vi.restoreAllMocks()
  })

  it('keeps the same collapsed Sidebar mounted while authenticated route content changes', () => {
    window.localStorage.setItem('sidebar-collapsed', 'true')
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)
    mountedRoots.push({ container, root })

    renderRoute(root, '/main')
    const sidebar = container.querySelector('aside')
    const observedStateStart = shellMocks.sidebarOpenStates.length

    expect(sidebar?.dataset.open).toBe('false')
    expect(shellMocks.sidebarMounts).toBe(1)

    for (const route of ['/profile/user-1', '/posts/post-1', '/profile/user-1', '/main']) {
      renderRoute(root, route)

      expect(container.querySelector('aside')).toBe(sidebar)
      expect(container.querySelector('aside')?.dataset.open).toBe('false')
      expect(shellMocks.sidebarMounts).toBe(1)
      expect(shellMocks.sidebarUnmounts).toBe(0)
    }

    expect(shellMocks.sidebarOpenStates.slice(observedStateStart)).toEqual([
      false,
      false,
      false,
      false,
    ])
  })

  it('keeps Profile content while selecting the anonymous public presentation', () => {
    shellMocks.status = 'bootstrapping'
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)
    mountedRoots.push({ container, root })
    renderRoute(root, '/profile/user-1')
    const profileContent = container.querySelector('p')

    expect(container.textContent).not.toContain('Public Header')
    expect(container.textContent).not.toContain('Authenticated Header')
    expect(container.querySelector('aside')).toBeNull()

    shellMocks.status = 'anonymous'
    renderRoute(root, '/profile/user-1')

    expect(container.textContent).toContain('Public Header')
    expect(container.textContent).not.toContain('Authenticated Header')
    expect(container.querySelector('aside')).toBeNull()
    expect(container.querySelector('p')).toBe(profileContent)
  })
})
