import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type { PostEntity } from '@/entities/post'

import { PostDetailsPage } from '../PostDetailsPage'

const apiMocks = vi.hoisted(() => ({
  deletePost: vi.fn(),
  post: vi.fn(),
  updatePostDescription: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

const synchronizationMocks = vi.hoisted(() => ({
  synchronizeDeletedPost: vi.fn(),
  synchronizeUpdatedPost: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  status: 'anonymous' as 'anonymous' | 'authenticated' | 'bootstrapping',
  userId: null as string | null,
}))

vi.mock('@/entities/post/api/postsApi', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>

  return {
    ...actual,
    deletePost: apiMocks.deletePost,
    post: apiMocks.post,
    updatePostDescription: apiMocks.updatePostDescription,
  }
})

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    status: sessionMocks.status,
    user: sessionMocks.userId ? { id: sessionMocks.userId } : null,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('@/features/edit-post/model/synchronizeUpdatedPost', () => ({
  synchronizeUpdatedPost: synchronizationMocks.synchronizeUpdatedPost,
}))

vi.mock('@/features/delete-post/model/synchronizeDeletedPost', () => ({
  synchronizeDeletedPost: synchronizationMocks.synchronizeDeletedPost,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('@/shared/assets', () => ({
  Close: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
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

function createPost(overrides: Partial<PostEntity> = {}): PostEntity {
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
      {
        file: {
          id: 'file-2',
          mimeType: 'JPEG',
          originalName: 'palm.jpg',
          ownerId: 'owner-1',
          purpose: 'POST_IMAGE',
          size: 2048,
          status: 'READY',
          url: 'https://example.com/palm.jpg',
        },
        fileId: 'file-2',
        sortOrder: 1,
      },
    ],
    author: {
      displayName: 'Backend Author',
      id: 'owner-1',
      profilePictureFileId: 'avatar-file-1',
      username: 'backend_author',
    },
    createdAt: '2026-08-20T12:00:00.000Z',
    description: 'Original description',
    id: 'post-1',
    ownerId: 'owner-1',
    updatedAt: '2026-08-20T12:00:00.000Z',
    ...overrides,
  }
}

function renderPage(postId = 'post-1'): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => root.render(<PostDetailsPage postId={postId} />))

  return { container, root }
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    }
  }

  throw lastError
}

function getDialogText(): string {
  return document.body.textContent ?? ''
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(textarea)
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  valueSetter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
}

function getEditDialog(): HTMLElement {
  const dialog = Array.from(document.body.querySelectorAll('[role="dialog"]')).find((item) =>
    item.textContent?.includes('Edit Post'),
  )

  if (!(dialog instanceof HTMLElement)) {
    throw new Error('Expected Edit Post dialog.')
  }

  return dialog
}

describe('PostDetailsPage', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    apiMocks.deletePost.mockReset()
    apiMocks.post.mockReset()
    apiMocks.updatePostDescription.mockReset()
    navigationMocks.replace.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
    synchronizationMocks.synchronizeDeletedPost.mockReset()
    synchronizationMocks.synchronizeDeletedPost.mockResolvedValue(undefined)
    synchronizationMocks.synchronizeUpdatedPost.mockReset()
    synchronizationMocks.synchronizeUpdatedPost.mockResolvedValue(undefined)
    sessionMocks.status = 'anonymous'
    sessionMocks.userId = null
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('renders loading state while post(id) is in flight', () => {
    apiMocks.post.mockReturnValue(new Promise(() => undefined))

    const view = renderPage()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Loading post...')
    expect(apiMocks.post).toHaveBeenCalledWith('post-1')
  })

  it('renders not-found when post(id) returns null', async () => {
    apiMocks.post.mockResolvedValue(null)

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('Post not found'))
  })

  it('renders an error state and retries post(id)', async () => {
    apiMocks.post
      .mockRejectedValueOnce(new Error('Post unavailable'))
      .mockResolvedValueOnce(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('Post unavailable'))

    act(() => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again')
        ?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Original description'))
    expect(apiMocks.post).toHaveBeenCalledTimes(2)
  })

  it('renders carousel, backend author, description and date', async () => {
    apiMocks.post.mockResolvedValue(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    expect(getDialogText()).toContain('Backend Author')
    expect(document.body.querySelector('[aria-label="Backend Author avatar"]')?.textContent).toBe(
      'B',
    )
    expect(document.body.querySelector('img[alt="beach.jpg"]')).toBeInstanceOf(HTMLImageElement)
    expect(document.body.querySelector('[data-fit="contain"]')).toBeInstanceOf(HTMLDivElement)
    expect(document.body.querySelector('button[aria-label="Show next image"]')).toBeInstanceOf(
      HTMLButtonElement,
    )
    expect(document.body.querySelector('button[aria-label="Post actions"]')).toBeNull()
  })

  it('opens edit on the active carousel image without carousel controls', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body
        .querySelector<HTMLButtonElement>('button[aria-label="Show next image"]')
        ?.click()
    })

    await waitFor(() =>
      expect(document.body.querySelector('img[alt="palm.jpg"]')).toBeInstanceOf(HTMLImageElement),
    )

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Edit Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit Post')
        ?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Save Changes'))
    expect(getEditDialog().querySelector('img[alt="palm.jpg"]')).toBeInstanceOf(HTMLImageElement)
    expect(getEditDialog().querySelector('button[aria-label="Show next image"]')).toBeNull()
    expect(getEditDialog().querySelector('button[aria-label="Show previous image"]')).toBeNull()
  })

  it('uses ownerId for owner actions and keeps backend author presentation in edit mode', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())
    apiMocks.updatePostDescription.mockResolvedValue(
      createPost({ description: 'Updated description' }),
    )

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Edit Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit Post')
        ?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Save Changes'))
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(document.body.querySelector('button[aria-label="Post actions"]')).toBeNull()
    expect(getEditDialog().textContent).toContain('Backend Author')
    expect(getEditDialog().querySelector('button[aria-label="Show next image"]')).toBeNull()

    const textArea = document.body.querySelector('textarea')

    expect(textArea).toBeInstanceOf(HTMLTextAreaElement)

    act(() => {
      if (!(textArea instanceof HTMLTextAreaElement)) {
        throw new Error('Expected description textarea.')
      }

      setTextareaValue(textArea, 'Updated description')
    })

    act(() => {
      const saveButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Save Changes'),
      )

      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(apiMocks.updatePostDescription).toHaveBeenCalledWith({
        description: 'Updated description',
        postId: 'post-1',
      })
      expect(document.body.querySelector('textarea')).toBeNull()
      expect(getDialogText()).toContain('Updated description')
    })
    expect(synchronizationMocks.synchronizeUpdatedPost).toHaveBeenCalledWith('post-1')
  })

  it('lets the post owner delete through the existing menu and delete flow', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())
    apiMocks.deletePost.mockResolvedValue(true)

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Delete Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Delete Post')
        ?.click()
    })

    await waitFor(() =>
      expect(getDialogText()).toContain('Are you sure you want to delete this post?'),
    )

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Yes')
        ?.click()
    })

    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalledWith('/main'))
    expect(apiMocks.deletePost).toHaveBeenCalledWith({ postId: 'post-1' })
    expect(synchronizationMocks.synchronizeDeletedPost).toHaveBeenCalledWith('post-1')
  })

  it('deletes back to a safe returnTo path from profile', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())
    apiMocks.deletePost.mockResolvedValue(true)
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '/profile/user-1' })

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Delete Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Delete Post')
        ?.click()
    })

    await waitFor(() =>
      expect(getDialogText()).toContain('Are you sure you want to delete this post?'),
    )

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Yes')
        ?.click()
    })

    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalledWith('/profile/user-1'))
    expect(apiMocks.deletePost).toHaveBeenCalledWith({ postId: 'post-1' })
  })

  it('falls back to /main when deleting with an unsafe returnTo', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())
    apiMocks.deletePost.mockResolvedValue(true)
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '//evil.example' })

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Delete Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Delete Post')
        ?.click()
    })

    await waitFor(() =>
      expect(getDialogText()).toContain('Are you sure you want to delete this post?'),
    )

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Yes')
        ?.click()
    })

    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalledWith('/main'))
  })

  it('hides Edit and Delete actions for an authenticated user who does not own the post', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'other-user'
    apiMocks.post.mockResolvedValue(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    expect(document.body.querySelector('button[aria-label="Post actions"]')).toBeNull()
    expect(getDialogText()).not.toContain('Delete Post')
  })

  it('returns from Edit to Details before closing to the profile returnTo', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '/profile/user-1' })

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Edit Post'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit Post')
        ?.click()
    })

    await waitFor(() =>
      expect(document.body.querySelector('textarea')).toBeInstanceOf(HTMLTextAreaElement),
    )

    act(() => {
      getEditDialog().querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    await waitFor(() => {
      expect(document.body.querySelector('textarea')).toBeNull()
      expect(getDialogText()).toContain('Original description')
    })
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    expect(navigationMocks.replace).toHaveBeenCalledWith('/profile/user-1')
  })

  it('closes a direct post link to /main', async () => {
    apiMocks.post.mockResolvedValue(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    expect(navigationMocks.replace).toHaveBeenCalledWith('/main')
  })

  it('closes to a safe returnTo path', async () => {
    apiMocks.post.mockResolvedValue(createPost())
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '/profile/user-1' })

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    expect(navigationMocks.replace).toHaveBeenCalledWith('/profile/user-1')
  })

  it('falls back to /main when returnTo is unsafe', async () => {
    apiMocks.post.mockResolvedValue(createPost())
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '//evil.example' })

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    expect(navigationMocks.replace).toHaveBeenCalledWith('/main')
  })

  it('asks for confirmation when closing a dirty edit form', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'owner-1'
    apiMocks.post.mockResolvedValue(createPost())

    const view = renderPage()
    mountedRoots.push(view)

    await waitFor(() => expect(getDialogText()).toContain('Original description'))

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })
    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Edit Post')
        ?.click()
    })

    await waitFor(() =>
      expect(document.body.querySelector('textarea')).toBeInstanceOf(HTMLTextAreaElement),
    )

    const textArea = document.body.querySelector('textarea')

    act(() => {
      if (!(textArea instanceof HTMLTextAreaElement)) {
        throw new Error('Expected description textarea.')
      }

      setTextareaValue(textArea, 'Dirty description')
    })

    act(() => {
      getEditDialog().querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Close posting editor'))
    expect(apiMocks.updatePostDescription).not.toHaveBeenCalled()
  })
})
