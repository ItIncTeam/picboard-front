import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type { FeedQueryData, PostEntity } from '@/entities/post'
import { I18nProvider } from '@/shared/lib/i18n'

import { MainPage } from '../MainPage'

type QueryResult = {
  data?: FeedQueryData
  error?: Error
  loading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const apolloMocks = vi.hoisted(() => ({
  result: null as unknown as QueryResult,
  useQuery: vi.fn(),
}))

vi.mock('@apollo/client/react', () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: (...args: unknown[]) => {
    apolloMocks.useQuery(...args)
    return apolloMocks.result
  },
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

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createPost(id: string, overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: `${id}-file-2`,
          mimeType: 'JPEG',
          originalName: `${id}-second.jpg`,
          ownerId: 'owner-1',
          purpose: 'POST_IMAGE',
          size: 2048,
          status: 'READY',
          url: `https://example.com/${id}-second.jpg`,
        },
        fileId: `${id}-file-2`,
        sortOrder: 1,
      },
      {
        file: {
          id: `${id}-file-1`,
          mimeType: 'JPEG',
          originalName: `${id}-first.jpg`,
          ownerId: 'owner-1',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: `https://example.com/${id}-first.jpg`,
        },
        fileId: `${id}-file-1`,
        sortOrder: 0,
      },
    ],
    author: {
      displayName: null,
      id: 'owner-1',
      profilePictureFileId: 'avatar-file-1',
      username: 'backend_author',
    },
    createdAt: '2026-08-17T12:00:00.000Z',
    description: `Description ${id}`,
    id,
    ownerId: 'owner-1',
    updatedAt: '2026-08-17T12:00:00.000Z',
    ...overrides,
  }
}

function renderMainPage(availableWidth?: number): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  if (availableWidth) {
    container.style.width = `${availableWidth}px`
  }

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <MainPage />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('MainPage', () => {
  const mountedRoots: RenderResult[] = []
  const refetch = vi.fn(() => Promise.resolve())

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    refetch.mockClear()
    apolloMocks.useQuery.mockReset()
    apolloMocks.result = { loading: false, refetch }
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('renders the existing publication skeleton while the feed is loading', () => {
    apolloMocks.result = { loading: true, refetch }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label="Loading publications"]')).toBeInstanceOf(
      HTMLElement,
    )
  })

  it('polls the feed every minute through Apollo', () => {
    const view = renderMainPage()
    mountedRoots.push(view)

    expect(apolloMocks.useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notifyOnNetworkStatusChange: false,
        pollInterval: 60_000,
      }),
    )
  })

  it('keeps usable feed data visible while Apollo refreshes it', () => {
    apolloMocks.result = {
      data: { feed: [createPost('existing-post')], usersCount: 1 },
      loading: true,
      refetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.querySelector('[data-post-id="existing-post"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.querySelector('[aria-label="Loading publications"]')).toBeNull()
  })

  it('keeps usable feed data visible after a transient background error', () => {
    apolloMocks.result = {
      data: { feed: [createPost('existing-post')], usersCount: 1 },
      error: new Error('Polling failed'),
      loading: false,
      refetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.querySelector('[data-post-id="existing-post"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.textContent).not.toContain("Couldn't load publications")
  })

  it('renders a fresh polling result without remounting the feed', () => {
    apolloMocks.result = {
      data: { feed: [createPost('existing-post')], usersCount: 1 },
      loading: false,
      refetch,
    }
    const view = renderMainPage()
    mountedRoots.push(view)

    apolloMocks.result = {
      data: { feed: [createPost('new-post'), createPost('existing-post')], usersCount: 1 },
      loading: false,
      refetch,
    }
    act(() =>
      view.root.render(
        <I18nProvider>
          <MainPage />
        </I18nProvider>,
      ),
    )

    expect(
      Array.from(view.container.querySelectorAll('article')).map((card) => card.dataset.postId),
    ).toEqual(['new-post', 'existing-post'])
  })

  it('preserves backend order and renders sorted attachments through the carousel', () => {
    apolloMocks.result = {
      data: { feed: [createPost('post-2'), createPost('post-1')], usersCount: 9213 },
      loading: false,
      refetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    const cards = Array.from(view.container.querySelectorAll('article'))
    expect(view.container.querySelector('[aria-label="Registered users: 9213"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(cards.map((card) => card.dataset.postId)).toEqual(['post-2', 'post-1'])

    const firstCard = cards[0]
    expect(firstCard?.querySelector('img')?.getAttribute('alt')).toBe('post-2-first.jpg')
    expect(firstCard?.querySelectorAll('[aria-label^="Show image"]')).toHaveLength(2)

    act(() => {
      firstCard
        ?.querySelector('[aria-label="Show next image"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(firstCard?.querySelector('img')?.getAttribute('alt')).toBe('post-2-second.jpg')
    expect(firstCard?.textContent).toContain('Description post-2')
    expect(firstCard?.textContent).toContain('backend_author')
    expect(firstCard?.querySelector('[aria-label="backend_author avatar"]')?.textContent).toBe('B')
  })

  it('renders an authenticated empty state for an empty successful feed', () => {
    apolloMocks.result = { data: { feed: [], usersCount: 0 }, loading: false, refetch }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('No publications yet')
    expect(view.container.querySelector('[aria-label="Registered users: 0"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.textContent).not.toContain("Couldn't load publications")
  })

  it('renders a feed error separately from empty and retries through refetch', () => {
    apolloMocks.result = { error: new Error('Gateway unavailable'), loading: false, refetch }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain("Couldn't load publications")
    expect(view.container.textContent).not.toContain('No publications yet')

    act(() => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('keeps the feed error state without an unhandled rejection when manual Retry fails', async () => {
    const retryPromise = Promise.reject(new Error('Retry failed'))
    const retryCatch = vi.spyOn(retryPromise, 'catch')
    const rejectedRefetch = vi.fn(() => retryPromise)
    apolloMocks.result = {
      error: new Error('Gateway unavailable'),
      loading: false,
      refetch: rejectedRefetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    await act(async () => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(rejectedRefetch).toHaveBeenCalledTimes(1)
    expect(retryCatch).toHaveBeenCalledTimes(1)
    expect(view.container.textContent).toContain("Couldn't load publications")
  })

  it('skips nullable files without breaking the feed card', () => {
    apolloMocks.result = {
      data: {
        feed: [
          createPost('post-null-file', {
            attachments: [{ file: null, fileId: 'missing-file', sortOrder: 0 }],
          }),
        ],
        usersCount: 1,
      },
      loading: false,
      refetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Photo unavailable')
    expect(view.container.querySelector('[data-post-id="post-null-file"]')).toBeInstanceOf(
      HTMLElement,
    )
  })

  it.each([
    {
      availableWidth: 1172,
      columns: 4,
      mode: 'expanded',
      viewportHeight: 900,
      viewportWidth: 1440,
    },
    {
      availableWidth: 1012,
      columns: 4,
      mode: 'expanded',
      viewportHeight: 800,
      viewportWidth: 1280,
    },
    { availableWidth: 756, columns: 3, mode: 'expanded', viewportHeight: 768, viewportWidth: 1024 },
    { availableWidth: 632, columns: 2, mode: 'expanded', viewportHeight: 700, viewportWidth: 900 },
    { availableWidth: 500, columns: 2, mode: 'expanded', viewportHeight: 667, viewportWidth: 768 },
    {
      availableWidth: 1320,
      columns: 4,
      mode: 'collapsed',
      viewportHeight: 900,
      viewportWidth: 1440,
    },
    {
      availableWidth: 1160,
      columns: 4,
      mode: 'collapsed',
      viewportHeight: 800,
      viewportWidth: 1280,
    },
    {
      availableWidth: 904,
      columns: 3,
      mode: 'collapsed',
      viewportHeight: 768,
      viewportWidth: 1024,
    },
    { availableWidth: 804, columns: 3, mode: 'collapsed', viewportHeight: 700, viewportWidth: 900 },
    { availableWidth: 648, columns: 2, mode: 'collapsed', viewportHeight: 667, viewportWidth: 768 },
    { availableWidth: 358, columns: 1, mode: 'mobile', viewportHeight: 844, viewportWidth: 390 },
  ])(
    'fits $columns columns at $viewportWidth x $viewportHeight with $mode navigation',
    async ({ availableWidth, columns, mode, viewportHeight, viewportWidth }) => {
      await page.viewport(viewportWidth, viewportHeight)
      apolloMocks.result = {
        data: {
          feed: [
            createPost('post-1'),
            createPost('post-2'),
            createPost('post-3'),
            createPost('post-4'),
          ],
          usersCount: 9213,
        },
        loading: false,
        refetch,
      }

      const view = renderMainPage(availableWidth)
      mountedRoots.push(view)

      const root = view.container.querySelector<HTMLElement>('section')
      const counter = view.container.querySelector<HTMLElement>(
        '[aria-label="Registered users: 9213"]',
      )
      const grid = view.container.querySelector<HTMLElement>('[data-testid="public-posts-grid"]')
      const firstCard = view.container.querySelector<HTMLElement>('article')
      const renderedColumns = grid
        ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
        : 0

      expect(renderedColumns).toBe(columns)
      expect(root?.getBoundingClientRect().width).toBeLessThanOrEqual(972)
      expect(counter?.getBoundingClientRect().width).toBe(grid?.getBoundingClientRect().width)
      expect(view.container.scrollWidth).toBeLessThanOrEqual(view.container.clientWidth)

      if (mode !== 'mobile') {
        expect(firstCard?.getBoundingClientRect().width).toBeLessThanOrEqual(234)
      }
    },
  )
})
