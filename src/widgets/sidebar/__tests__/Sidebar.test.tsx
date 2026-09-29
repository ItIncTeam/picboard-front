import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import { I18nProvider } from '@/shared/lib/i18n'

import { Sidebar } from '../Sidebar'

const navigationMocks = vi.hoisted(() => ({
  pathname: '/main',
  searchParams: new URLSearchParams(),
}))

const sessionMocks = vi.hoisted(() => ({
  userId: 'current-user-id',
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('@/features/auth/logout-button', () => ({
  LogoutButton: () => null,
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: sessionMocks.userId },
  }),
}))

vi.mock('@/shared/assets', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />

  return {
    BookmarkFilledIcon: Icon,
    BookmarkIcon: Icon,
    HomeFilledIcon: Icon,
    HomeIcon: Icon,
    MessageCircleFilledIcon: Icon,
    MessageCircleIcon: Icon,
    PersonFilledIcon: Icon,
    PersonIcon: Icon,
    PlusSquareFilledIcon: Icon,
    PlusSquareIcon: Icon,
    SearchIcon: Icon,
    SearchOutlineIcon: Icon,
    TrendingUpFilledIcon: Icon,
    TrendingUpIcon: Icon,
  }
})

vi.mock('@/shared/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactElement }) => children,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderSidebar(isOpen: boolean): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <Sidebar
          isMobile={false}
          isOpen={isOpen}
          onCloseAction={vi.fn()}
          onToggleSidebarAction={vi.fn()}
        />
      </I18nProvider>,
    )
  })

  return { container, root }
}

function getFirstNavigationIcon(container: HTMLElement): SVGSVGElement {
  const icon = container.querySelector('nav a svg')

  if (!(icon instanceof SVGSVGElement)) {
    throw new Error('Expected the first sidebar navigation icon.')
  }

  return icon
}

async function waitForTransition(milliseconds: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds)
    })
  })
}

describe('Sidebar', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(async () => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    navigationMocks.pathname = '/main'
    navigationMocks.searchParams = new URLSearchParams()
    sessionMocks.userId = 'current-user-id'
    await page.viewport(1024, 768)
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

  it('links Feed to the canonical main route and marks it active on main', () => {
    const view = renderSidebar(true)

    mountedRoots.push(view)

    const feedLink = view.container.querySelector('nav a')

    expect(feedLink?.getAttribute('href')).toBe('/main')
    expect(feedLink?.getAttribute('aria-current')).toBe('page')
  })

  it('builds My Profile href from the current session user id', () => {
    sessionMocks.userId = 'user/id with spaces'
    const view = renderSidebar(true)

    mountedRoots.push(view)

    const profileLink = Array.from(view.container.querySelectorAll('nav a')).find((link) =>
      link.getAttribute('href')?.startsWith('/profile/'),
    )

    expect(profileLink?.getAttribute('href')).toBe('/profile/user%2Fid%20with%20spaces')
    expect(profileLink?.getAttribute('href')).not.toContain('/profile/me')
  })

  it('keeps navigation icons on the same horizontal axis while collapsing', async () => {
    const view = renderSidebar(true)

    mountedRoots.push(view)

    const expandedLeft = getFirstNavigationIcon(view.container).getBoundingClientRect().left

    act(() => {
      view.root.render(
        <I18nProvider>
          <Sidebar
            isMobile={false}
            isOpen={false}
            onCloseAction={vi.fn()}
            onToggleSidebarAction={vi.fn()}
          />
        </I18nProvider>,
      )
    })

    await waitForTransition(80)
    const transitionLeft = getFirstNavigationIcon(view.container).getBoundingClientRect().left

    await waitForTransition(180)
    const collapsedLeft = getFirstNavigationIcon(view.container).getBoundingClientRect().left

    expect(transitionLeft).toBeCloseTo(expandedLeft, 0)
    expect(collapsedLeft).toBeCloseTo(expandedLeft, 0)
  })
})
