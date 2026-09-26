import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'

import { I18nProvider } from '@/shared/lib/i18n'
import type { PublicPostCardModel } from '../model/types'
import { PublicPostCard } from '../ui/PublicPostCard'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
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

const post: PublicPostCardModel = {
  author: {
    avatar: null,
    displayName: '  Backend Author  ',
    id: 'owner-1',
    profilePictureFileId: 'avatar-file-1',
    username: 'backend_author',
  },
  createdAt: 'invalid',
  description: 'A'.repeat(120),
  id: 'post-1',
  media: [
    { alt: 'Post image', id: 'media-1', url: 'https://example.com/post.jpg' },
    { alt: 'Post image 2', id: 'media-2', url: 'https://example.com/post-2.jpg' },
  ],
}

function renderCard(postToRender = post): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() =>
    root.render(
      <I18nProvider>
        <PublicPostCard post={postToRender} />
      </I18nProvider>,
    ),
  )

  return { container, root }
}

describe('PublicPostCard', () => {
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

  it('uses the shared Figma typography and preserves the description toggle', () => {
    const view = renderCard()
    mountedRoots.push(view)

    const authorName = Array.from(view.container.querySelectorAll('span')).find(
      (element) => element.textContent === 'Backend Author',
    )
    const description = view.container.querySelector('p')
    const toggle = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show more',
    )

    expect(getComputedStyle(authorName as Element).fontSize).toBe('16px')
    expect(getComputedStyle(authorName as Element).lineHeight).toBe('24px')
    expect(getComputedStyle(authorName as Element).fontWeight).toBe('600')
    expect(getComputedStyle(description as Element).fontSize).toBe('14px')
    expect(getComputedStyle(description as Element).lineHeight).toBe('24px')
    expect(getComputedStyle(toggle as Element).textDecorationLine).toBe('underline')
    expect(view.container.querySelector('[aria-label="Backend Author avatar"]')?.textContent).toBe(
      'B',
    )

    act(() => toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(toggle?.textContent).toBe('Hide')
  })

  it('uses the public author avatar URL when available', () => {
    const view = renderCard({
      ...post,
      author: {
        ...post.author,
        avatar: {
          id: 'avatar-file-1',
          url: 'https://example.com/avatar.jpg',
        },
      },
    })
    mountedRoots.push(view)

    expect(
      view.container.querySelector('[aria-label="Backend Author avatar"] img'),
    ).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('links media, createdAt, and description to the post and author to the profile', () => {
    const view = renderCard()
    mountedRoots.push(view)

    expect(
      view.container.querySelector('a[aria-label="View post post-1"][href="/posts/post-1"]'),
    ).toBeInstanceOf(HTMLAnchorElement)
    expect(view.container.querySelector('a[href="/posts/post-1"] time')).toBeInstanceOf(
      HTMLTimeElement,
    )
    expect(view.container.querySelector('p a[href="/posts/post-1"]')?.textContent).toContain('…')
    expect(view.container.querySelector('a[href="/profile/owner-1"]')?.textContent).toContain(
      'Backend Author',
    )
  })

  it('keeps carousel controls and description toggle outside post navigation', () => {
    const view = renderCard()
    mountedRoots.push(view)

    const article = view.container.querySelector('article')
    const previous = view.container.querySelector('button[aria-label="Show previous image"]')
    const next = view.container.querySelector('button[aria-label="Show next image"]')
    const dots = view.container.querySelectorAll('button[aria-pressed]')
    const toggle = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show more',
    )

    expect(article?.firstElementChild?.tagName).toBe('DIV')
    expect(previous).toBeInstanceOf(HTMLButtonElement)
    expect(next).toBeInstanceOf(HTMLButtonElement)
    expect(dots.length).toBe(2)
    expect(previous?.closest('a')).toBeNull()
    expect(next?.closest('a')).toBeNull()
    expect(Array.from(dots).every((dot) => dot.closest('a') === null)).toBe(true)
    expect(toggle?.closest('a')).toBeNull()
  })
})
