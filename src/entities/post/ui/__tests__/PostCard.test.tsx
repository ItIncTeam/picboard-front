import { act, type ComponentProps, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Post } from '@/entities/post'

import { PostCard } from '../PostCard'
import { PostGrid } from '../PostGrid'

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

const post: Post = {
  authorName: 'User',
  caption: 'Caption',
  id: 'post-1',
  images: [{ alt: 'post-1.jpg', id: 'image-1', url: 'https://example.com/post-1.jpg' }],
}

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function render(node: ReactNode): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => root.render(node))

  return { container, root }
}

describe('PostCard returnTo href', () => {
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

  it('links to the post without returnTo by default', () => {
    const view = render(<PostCard post={post} />)
    mountedRoots.push(view)

    expect(view.container.querySelector('a[href="/posts/post-1"]')).toBeInstanceOf(
      HTMLAnchorElement,
    )
  })

  it('passes encoded returnTo from PostGrid to the post details href', () => {
    const view = render(<PostGrid posts={[post]} returnTo="/profile/profile-user" />)
    mountedRoots.push(view)

    expect(
      view.container.querySelector('a[href="/posts/post-1?returnTo=%2Fprofile%2Fprofile-user"]'),
    ).toBeInstanceOf(HTMLAnchorElement)
  })
})
