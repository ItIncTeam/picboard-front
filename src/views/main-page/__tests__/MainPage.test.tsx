import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type { PostEntity } from '@/entities/post'

import { MainPage } from '../MainPage'

type QueryResult = {
  data?: { feed: PostEntity[] }
  error?: Error
  loading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const apolloMocks = vi.hoisted(() => ({
  result: null as unknown as QueryResult,
}))

vi.mock('@apollo/client/react', () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => apolloMocks.result,
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
    createdAt: '2026-08-17T12:00:00.000Z',
    description: `Description ${id}`,
    id,
    ownerId: 'owner-1',
    updatedAt: '2026-08-17T12:00:00.000Z',
    ...overrides,
  }
}

function renderMainPage(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<MainPage />)
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

  it('preserves backend order and renders sorted attachments through the carousel', () => {
    apolloMocks.result = {
      data: { feed: [createPost('post-2'), createPost('post-1')] },
      loading: false,
      refetch,
    }

    const view = renderMainPage()
    mountedRoots.push(view)

    const cards = Array.from(view.container.querySelectorAll('article'))
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
    expect(firstCard?.textContent).toContain('User')
  })

  it('renders an authenticated empty state for an empty successful feed', () => {
    apolloMocks.result = { data: { feed: [] }, loading: false, refetch }

    const view = renderMainPage()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('No publications yet')
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

  it('skips nullable files without breaking the feed card', () => {
    apolloMocks.result = {
      data: {
        feed: [
          createPost('post-null-file', {
            attachments: [{ file: null, fileId: 'missing-file', sortOrder: 0 }],
          }),
        ],
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
})
