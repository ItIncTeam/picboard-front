import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PublicHomePage, type PublicHomePost } from '../PublicHomePage'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const posts: PublicHomePost[] = [
  {
    authorAvatarUrl: 'https://example.com/avatar-1.jpg',
    authorName: 'FirstUser',
    caption: 'First public post caption.',
    createdAtLabel: '22 min ago',
    id: 'post-1',
    imageAlt: 'First public post image',
    imageUrl: 'https://example.com/post-1.jpg',
  },
  {
    authorAvatarUrl: 'https://example.com/avatar-2.jpg',
    authorName: 'SecondUser',
    caption: 'Second public post caption.',
    createdAtLabel: '18 min ago',
    id: 'post-2',
    imageAlt: 'Second public post image',
    imageUrl: 'https://example.com/post-2.jpg',
  },
  {
    authorAvatarUrl: 'https://example.com/avatar-3.jpg',
    authorName: 'ThirdUser',
    caption: 'Third public post caption.',
    createdAtLabel: '12 min ago',
    id: 'post-3',
    imageAlt: 'Third public post image',
    imageUrl: 'https://example.com/post-3.jpg',
  },
  {
    authorAvatarUrl: 'https://example.com/avatar-4.jpg',
    authorName: 'FourthUser',
    caption: 'Fourth public post caption.',
    createdAtLabel: '8 min ago',
    id: 'post-4',
    imageAlt: 'Fourth public post image',
    imageUrl: 'https://example.com/post-4.jpg',
  },
  {
    authorAvatarUrl: 'https://example.com/avatar-5.jpg',
    authorName: 'FifthUser',
    caption: 'Fifth public post caption.',
    createdAtLabel: '5 min ago',
    id: 'post-5',
    imageAlt: 'Fifth public post image',
    imageUrl: 'https://example.com/post-5.jpg',
  },
]

function renderPublicHomePage({
  usersCount = 9213,
}: {
  usersCount?: number
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<PublicHomePage posts={posts} usersCount={usersCount} />)
  })

  return { container, root }
}

describe('PublicHomePage', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
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

  it('renders the registered users counter with padded digits', () => {
    const view = renderPublicHomePage()

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Registered users:')
    expect(view.container.querySelector('[aria-label="9213 registered users"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(
      Array.from(view.container.querySelectorAll('[aria-hidden="true"] span'))
        .map((digit) => digit.textContent)
        .join(''),
    ).toBe('009213')
  })

  it('renders only the four latest public posts', () => {
    const view = renderPublicHomePage()

    mountedRoots.push(view)

    expect(view.container.querySelectorAll('article')).toHaveLength(4)
    expect(view.container.textContent).toContain('FirstUser')
    expect(view.container.textContent).toContain('FourthUser')
    expect(view.container.textContent).not.toContain('FifthUser')
  })

  it('renders show more actions for post captions', () => {
    const view = renderPublicHomePage()

    mountedRoots.push(view)

    expect(
      Array.from(view.container.querySelectorAll('button')).map((button) => button.textContent),
    ).toEqual(['Show more', 'Show more', 'Show more', 'Show more'])
  })
})
