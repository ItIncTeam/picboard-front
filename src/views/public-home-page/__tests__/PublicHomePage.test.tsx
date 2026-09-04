import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import { I18nProvider } from '@/shared/lib/i18n'
import type { PublicPostCardModel } from '@/widgets/public-post-card'
import { PublicHomeContent } from '../PublicHomePage'

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

function createPost(id: string, overrides: Partial<PublicPostCardModel> = {}): PublicPostCardModel {
  return {
    author: {
      displayName: null,
      id: `owner-${id}`,
      profilePictureFileId: null,
      username: `author_${id}`,
    },
    createdAt: 'invalid',
    description: `Short description ${id}`,
    id,
    media: [
      {
        alt: `Image ${id}`,
        id: `${id}-media-1`,
        url: `https://example.com/${id}-1.jpg`,
      },
    ],
    ...overrides,
  }
}

const posts = Array.from({ length: 4 }, (_, index) => createPost(`post-${index + 1}`))

function renderContent(data: Parameters<typeof PublicHomeContent>[0]['data']): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <PublicHomeContent data={data} />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('PublicHomeContent', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    await page.viewport(1280, 720)
  })

  it('renders the counter and posts in input order', () => {
    const view = renderContent({ posts, usersCount: 9213 })
    mountedRoots.push(view)

    expect(view.container.querySelector('[aria-label="Registered users: 9213"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.querySelectorAll('article')).toHaveLength(4)
    expect(
      Array.from(view.container.querySelectorAll('article')).map((card) => card.dataset.postId),
    ).toEqual(['post-1', 'post-2', 'post-3', 'post-4'])
  })

  it('renders a successful empty feed and a real zero users count', () => {
    const view = renderContent({ posts: [], usersCount: 0 })
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('No public posts yet')
    expect(view.container.textContent).toContain('Registered users:')
    expect(view.container.querySelector('[aria-label="Registered users: 0"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(view.container.textContent).not.toContain('Public posts are unavailable')
  })

  it('navigates multiple media while a single image has no carousel controls', () => {
    const view = renderContent({
      posts: [
        createPost('multiple', {
          media: [
            { alt: 'First image', id: 'first', url: 'https://example.com/first.jpg' },
            { alt: 'Second image', id: 'second', url: 'https://example.com/second.jpg' },
          ],
        }),
        createPost('single'),
      ],
      usersCount: 2,
    })
    mountedRoots.push(view)

    const multipleCard = view.container.querySelector('[data-post-id="multiple"]')
    const singleCard = view.container.querySelector('[data-post-id="single"]')
    expect(multipleCard?.querySelectorAll('[aria-label^="Show image"]')).toHaveLength(2)
    expect(singleCard?.querySelector('[aria-label="Show next image"]')).toBeNull()

    const nextButton = multipleCard?.querySelector('[aria-label="Show next image"]')
    act(() => nextButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(multipleCard?.querySelector('img')?.getAttribute('alt')).toBe('Second image')
  })

  it('shows a media placeholder and the backend author fallback', () => {
    const view = renderContent({
      posts: [createPost('no-media', { media: [] })],
      usersCount: 1,
    })
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Photo unavailable')
    expect(view.container.textContent).toContain('author_no-media')
    expect(view.container.querySelector('[aria-label="author_no-media avatar"]')?.textContent).toBe(
      'A',
    )
    expect(view.container.textContent).toContain('Recently')
  })

  it('only renders Show more for long descriptions and toggles it to Hide', () => {
    const longDescription = 'A'.repeat(120)
    const view = renderContent({
      posts: [createPost('short'), createPost('long', { description: longDescription })],
      usersCount: 2,
    })
    mountedRoots.push(view)

    const showMoreButtons = Array.from(view.container.querySelectorAll('button')).filter(
      (button) => button.textContent === 'Show more',
    )
    expect(showMoreButtons).toHaveLength(1)

    act(() => showMoreButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(showMoreButtons[0]?.textContent).toBe('Hide')
    expect(view.container.textContent).toContain(longDescription)
  })

  it.each([
    { columns: 1, height: 568, width: 320 },
    { columns: 1, height: 667, width: 375 },
    { columns: 1, height: 400, width: 375 },
    { columns: 3, height: 600, width: 768 },
    { columns: 4, height: 900, width: 1440 },
  ])('fits the $width x $height viewport without horizontal overflow', async (viewport) => {
    await page.viewport(viewport.width, viewport.height)

    const responsivePosts = [
      createPost('responsive', {
        media: [
          { alt: 'Wide image', id: 'wide', url: 'https://example.com/wide.jpg' },
          { alt: 'Portrait image', id: 'portrait', url: 'https://example.com/portrait.jpg' },
        ],
      }),
      ...posts.slice(1, 4),
    ]
    const view = renderContent({ posts: responsivePosts, usersCount: 1234567 })
    mountedRoots.push(view)

    const grid = view.container.querySelector<HTMLElement>('[data-testid="public-posts-grid"]')
    const renderedColumns = grid
      ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
      : 0

    expect(renderedColumns).toBe(viewport.columns)
    expect(view.container.scrollWidth).toBeLessThanOrEqual(view.container.clientWidth)

    const responsiveCard = view.container.querySelector<HTMLElement>('[data-post-id="responsive"]')
    const carousel = responsiveCard?.querySelector('img')?.parentElement
    const previousButton = carousel?.querySelector<HTMLElement>(
      '[aria-label="Show previous image"]',
    )
    const nextButton = carousel?.querySelector<HTMLElement>('[aria-label="Show next image"]')
    const carouselBounds = carousel?.getBoundingClientRect()

    expect(previousButton?.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      carouselBounds?.left ?? 0,
    )
    expect(nextButton?.getBoundingClientRect().right).toBeLessThanOrEqual(
      carouselBounds?.right ?? 0,
    )

    if (viewport.height === 400) {
      expect(view.container.getBoundingClientRect().height).toBeGreaterThan(viewport.height)
      expect(getComputedStyle(document.documentElement).overflowY).not.toBe('hidden')
    }

    if (viewport.width === 1440) {
      const card = view.container.querySelector('article')

      expect(card?.getBoundingClientRect().width).toBeGreaterThanOrEqual(233)
      expect(card?.getBoundingClientRect().width).toBeLessThanOrEqual(235)
    }
  })
})
