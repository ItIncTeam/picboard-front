import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'

import type { PublicPostCardModel } from '../model/types'
import { PublicPostCard } from '../ui/PublicPostCard'

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
  author: { avatarUrl: null, name: 'User' },
  createdAt: 'invalid',
  description: 'A'.repeat(120),
  id: 'post-1',
  media: [{ alt: 'Post image', id: 'media-1', url: 'https://example.com/post.jpg' }],
}

function renderCard(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => root.render(<PublicPostCard post={post} />))

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
      (element) => element.textContent === 'User',
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

    act(() => toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(toggle?.textContent).toBe('Hide')
  })
})
