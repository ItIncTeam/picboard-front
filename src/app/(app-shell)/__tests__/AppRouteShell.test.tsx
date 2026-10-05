import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'

import { AppRouteShell } from '../AppRouteShell'

const shellMocks = vi.hoisted(() => ({
  reducedMotion: false,
  segments: ['(protected)', '(main)', 'main'],
  sidebarMounts: 0,
  sidebarUnmounts: 0,
  status: 'authenticated' as 'anonymous' | 'authenticated' | 'bootstrapping',
}))

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegments: () => shellMocks.segments,
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

function renderRoute(root: Root, route: string, primaryRoute = route) {
  const segments = primaryRoute.split(/[?#]/)[0]?.split('/').filter(Boolean) ?? []
  shellMocks.segments =
    segments[0] === 'profile' ? ['(profile)', ...segments] : ['(protected)', '(main)', ...segments]
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
    shellMocks.status = 'authenticated'
    shellMocks.reducedMotion = false
    shellMocks.segments = ['(protected)', '(main)', 'main']
    window.localStorage.clear()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === '(prefers-reduced-motion: reduce)' && shellMocks.reducedMotion,
      removeEventListener: vi.fn(),
    }))
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

  function mountRoute(route = '/main'): RenderResult {
    const container = document.createElement('div')
    const root = createRoot(container)
    document.body.append(container)
    mountedRoots.push({ container, root })
    renderRoute(root, route)

    return { container, root }
  }

  function getPageBoundary(container: HTMLDivElement): HTMLElement {
    const boundary = container.querySelector<HTMLElement>('main > div')

    if (!boundary) {
      throw new Error('Missing routed content boundary')
    }

    return boundary
  }

  it('does not animate the initial render', () => {
    const { container } = mountRoute()

    expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')
  })

  it.each([
    ['/main', '/profile/user-1'],
    ['/profile/user-1', '/favorites'],
    ['/favorites', '/settings/profile'],
    ['/settings/profile', '/main'],
  ])(
    'fades primary navigation from %s to %s without replacing the subtree or shell',
    (from, to) => {
      const { container, root } = mountRoute(from)
      const boundary = getPageBoundary(container)
      const content = container.querySelector('p')
      const header = container.querySelector('header')
      const sidebar = container.querySelector('aside')
      const scrollContainer = container.querySelector('main')

      if (!content || !scrollContainer) {
        throw new Error('Missing route content or scroll container')
      }

      content.style.minHeight = '1600px'
      scrollContainer.scrollTop = 80
      boundary.tabIndex = 0
      boundary.focus({ preventScroll: true })

      renderRoute(root, to)

      const style = getComputedStyle(boundary)
      expect(style.animationName).not.toBe('none')
      expect(style.animationDuration).toBe('0.16s')
      expect(style.animationTimingFunction).toBe('ease-out')
      expect(getPageBoundary(container)).toBe(boundary)
      expect(container.querySelector('p')).toBe(content)
      expect(container.querySelector('header')).toBe(header)
      expect(container.querySelector('aside')).toBe(sidebar)
      expect(container.querySelector('main')).toBe(scrollContainer)
      expect(scrollContainer.scrollTop).toBe(80)
      expect(document.activeElement).toBe(boundary)
    },
  )

  it.each([
    ['/main', '/main'],
    ['/profile/user-1', '/profile/user-2'],
    ['/settings/profile', '/settings/account'],
    ['/main', '/main?filter=recent#posts'],
    ['/main', '/posts/post-1'],
    ['/posts/post-1', '/main'],
    ['/main', '/posts/create'],
  ])('does not animate excluded navigation from %s to %s', (from, to) => {
    const { container, root } = mountRoute(from)

    renderRoute(root, to)

    expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')
  })

  it('does not animate the background when a modal opens, changes or closes', () => {
    const { container, root } = mountRoute('/profile/user-1')

    for (const url of ['/posts/post-1', '/posts/post-2', '/posts/create', '/profile/user-1']) {
      // Interception changes the URL/modal slot while preserving the primary slot.
      renderRoute(root, url, '/profile/user-1')
      expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')
    }
  })

  it('restarts rapid navigation on the same boundary instead of queueing effects', () => {
    const { container, root } = mountRoute()
    const boundary = getPageBoundary(container)

    renderRoute(root, '/profile/user-1')
    const previousAnimation = boundary.getAnimations()[0]
    expect(previousAnimation).toBeDefined()

    renderRoute(root, '/favorites')

    expect(getPageBoundary(container)).toBe(boundary)
    expect(previousAnimation?.playState).toBe('idle')
    expect(boundary.getAnimations()).toHaveLength(1)
    expect(boundary.getAnimations()[0]).not.toBe(previousAnimation)
  })

  it('does not animate bootstrap, session changes or anonymous redirects', () => {
    shellMocks.status = 'bootstrapping'
    const { container, root } = mountRoute()
    shellMocks.status = 'authenticated'
    renderRoute(root, '/profile/user-1')
    expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')

    shellMocks.status = 'anonymous'
    renderRoute(root, '/favorites')
    expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')
  })

  it('skips animation for reduced motion', () => {
    const { container, root } = mountRoute()
    shellMocks.reducedMotion = true

    renderRoute(root, '/profile/user-1')

    expect(getComputedStyle(getPageBoundary(container)).animationName).toBe('none')
  })

  it('keeps the same collapsed Sidebar mounted while authenticated route content changes', () => {
    window.localStorage.setItem('sidebar-collapsed', 'true')
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)
    mountedRoots.push({ container, root })

    renderRoute(root, '/main')
    const sidebar = container.querySelector('aside')

    expect(sidebar?.dataset.open).toBe('false')
    expect(shellMocks.sidebarMounts).toBe(1)

    for (const route of ['/profile/user-1', '/posts/post-1', '/profile/user-1', '/main']) {
      renderRoute(root, route)

      expect(container.querySelector('aside')).toBe(sidebar)
      expect(container.querySelector('aside')?.dataset.open).toBe('false')
      expect(shellMocks.sidebarMounts).toBe(1)
      expect(shellMocks.sidebarUnmounts).toBe(0)
    }
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
