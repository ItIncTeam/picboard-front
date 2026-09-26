import { createElement, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PostEntity } from '@/entities/post'
import { I18nProvider } from '@/shared/lib/i18n'

const loadInitialPostMocks = vi.hoisted(() => ({
  getCachedInitialPost: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('../api/loadInitialPost', () => ({
  getCachedInitialPost: loadInitialPostMocks.getCachedInitialPost,
}))

vi.mock('next/navigation', () => ({
  notFound: navigationMocks.notFound,
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    status: 'anonymous',
    user: null,
  }),
}))

vi.mock('next/image', async () => {
  const { createElement } = await import('react')

  return {
    __esModule: true,
    default: ({ alt, src }: { alt?: string; src?: string }) =>
      createElement('img', { alt, src: typeof src === 'string' ? src : '' }),
  }
})

vi.mock('next/link', async () => {
  const { createElement } = await import('react')

  return {
    __esModule: true,
    default: ({ children, href }: { children?: ReactNode; href?: string }) =>
      createElement('a', { href }, children),
  }
})

vi.mock('@/shared/assets', async () => {
  const { createElement } = await import('react')

  return {
    Close: (props: Record<string, unknown>) => createElement('svg', props),
  }
})

import { PostDetailsPage } from '../PostDetailsPage'

function createPost(): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: 'file-1',
          mimeType: 'JPEG',
          originalName: 'beach.jpg',
          ownerId: 'owner-1',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: 'https://example.com/beach.jpg',
        },
        fileId: 'file-1',
        sortOrder: 0,
      },
    ],
    author: {
      avatar: null,
      displayName: 'Backend Author',
      id: 'owner-1',
      profilePictureFileId: null,
      username: 'backend_author',
    },
    createdAt: '2026-08-20T12:00:00.000Z',
    description: 'Original description',
    id: 'post-1',
    ownerId: 'owner-1',
    updatedAt: '2026-08-20T12:00:00.000Z',
  }
}

describe('PostDetailsPage', () => {
  afterEach(() => {
    loadInitialPostMocks.getCachedInitialPost.mockReset()
    navigationMocks.notFound.mockClear()
    navigationMocks.replace.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
  })

  it('puts Post Details into the server HTML without a portal', async () => {
    const post = createPost()
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce({
      baselineKey: 'baseline-1',
      post,
    })

    const view = await PostDetailsPage({ postId: 'post-1' })
    const html = renderToString(createElement(I18nProvider, null, view))

    expect(loadInitialPostMocks.getCachedInitialPost).toHaveBeenCalledWith('post-1')
    expect(navigationMocks.notFound).not.toHaveBeenCalled()
    expect(html).toContain('Original description')
    expect(html).toContain('Backend Author')
    expect(html).toContain('Post details')
    expect(html).toContain('beach.jpg')
    expect(html).toContain('<article')
  })

  it('calls notFound when the post is missing', async () => {
    loadInitialPostMocks.getCachedInitialPost.mockResolvedValueOnce(null)

    await expect(PostDetailsPage({ postId: 'missing-post' })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1)
  })
})
