import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type * as PostModule from '@/entities/post'
import type { PostConnection, PostEntity } from '@/entities/post'
import type { PublicUser } from '@/entities/user'

import { ProfilePage } from '../ProfilePage'

const apiMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilePosts: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  status: 'anonymous' as 'anonymous' | 'authenticated' | 'bootstrapping',
  userId: null as string | null,
}))

vi.mock('@/entities/user', () => ({
  getUser: apiMocks.getUser,
}))

vi.mock('@/entities/post', async (importOriginal) => ({
  ...(await importOriginal<typeof PostModule>()),
  profilePosts: apiMocks.profilePosts,
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    status: sessionMocks.status,
    user: sessionMocks.userId ? { id: sessionMocks.userId } : null,
  }),
}))

vi.mock('@/shared/assets', () => ({
  PersonIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
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

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

const observerRecords: Array<{ active: boolean; callback: IntersectionObserverCallback }> = []

class IntersectionObserverMock {
  private readonly record: (typeof observerRecords)[number]

  disconnect = vi.fn(() => {
    this.record.active = false
  })
  observe = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = '0px'
  thresholds = [0]

  constructor(callback: IntersectionObserverCallback) {
    this.record = { active: true, callback }
    observerRecords.push(this.record)
  }
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: (value) => resolvePromise?.(value),
  }
}

function createUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    bio: 'Profile biography',
    displayName: 'Display Name',
    id: 'profile-user',
    profilePictureFileId: null,
    username: 'profile_username',
    ...overrides,
  }
}

function createPost(id: string): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: `${id}-file`,
          mimeType: 'JPEG',
          originalName: `${id}.jpg`,
          ownerId: 'profile-user',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: `https://example.com/${id}.jpg`,
        },
        fileId: `${id}-file`,
        sortOrder: 0,
      },
    ],
    author: {
      displayName: 'Profile Post Author',
      id: 'profile-user',
      profilePictureFileId: null,
      username: 'profile_post_author',
    },
    createdAt: '2026-08-20T12:00:00.000Z',
    description: id,
    id,
    ownerId: 'profile-user',
    updatedAt: '2026-08-20T12:00:00.000Z',
  }
}

function createConnection(
  posts: PostEntity[],
  options: { endCursor?: string | null; hasNextPage?: boolean } = {},
): PostConnection {
  return {
    edges: posts.map((node) => ({ cursor: `cursor-${node.id}`, node })),
    pageInfo: {
      endCursor: options.endCursor ?? null,
      hasNextPage: options.hasNextPage ?? false,
      startCursor: posts[0] ? `cursor-${posts[0].id}` : null,
    },
  }
}

function renderProfile(userId = 'profile-user'): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => root.render(<ProfilePage userId={userId} />))

  return { container, root }
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 40; attempt += 1) {
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

async function triggerIntersection(): Promise<void> {
  const callback = observerRecords.findLast(({ active }) => active)?.callback

  if (!callback) {
    throw new Error('Expected a profile posts IntersectionObserver.')
  }

  await act(async () => {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    await Promise.resolve()
  })
}

describe('ProfilePage', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    apiMocks.getUser.mockReset()
    apiMocks.profilePosts.mockReset()
    observerRecords.length = 0
    sessionMocks.status = 'anonymous'
    sessionMocks.userId = null
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    vi.unstubAllGlobals()
  })

  it('renders loading state and requests the first eight posts', () => {
    apiMocks.getUser.mockReturnValue(new Promise(() => undefined))
    apiMocks.profilePosts.mockReturnValue(new Promise(() => undefined))

    const view = renderProfile()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Loading profile...')
    expect(view.container.querySelector('[aria-label="Loading publications"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(apiMocks.profilePosts).toHaveBeenCalledWith({ first: 8, userId: 'profile-user' })
  })

  it('renders public user data without exposing email and shows empty posts state', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.profilePosts.mockResolvedValue(createConnection([]))

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('profile_username'))

    expect(view.container.textContent).toContain('Display Name')
    expect(view.container.textContent).toContain('About me')
    expect(view.container.textContent).toContain('Profile biography')
    expect(view.container.textContent).toContain('No publications yet')
  })

  it('renders posts in backend order', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.profilePosts.mockResolvedValue(
      createConnection([createPost('newest-post'), createPost('older-post')]),
    )

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(2))

    expect(
      Array.from(view.container.querySelectorAll('article img')).map((image) =>
        image.getAttribute('alt'),
      ),
    ).toEqual(['newest-post.jpg', 'older-post.jpg'])
    expect(
      view.container.querySelector(
        'a[href="/posts/newest-post?returnTo=%2Fprofile%2Fprofile-user"]',
      ),
    ).toBeInstanceOf(HTMLAnchorElement)
  })

  it('renders an error state and retries the initial request', async () => {
    apiMocks.getUser
      .mockRejectedValueOnce(new Error('Profile unavailable'))
      .mockResolvedValueOnce(createUser())
    apiMocks.profilePosts.mockResolvedValue(createConnection([]))

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('Profile unavailable'))

    act(() => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again')
        ?.click()
    })

    await waitFor(() => expect(view.container.textContent).toContain('profile_username'))
    expect(apiMocks.getUser).toHaveBeenCalledTimes(2)
  })

  it('shows Profile Settings only to the profile owner', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'profile-user'
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.profilePosts.mockResolvedValue(createConnection([]))

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('Profile Settings'))
    expect(view.container.querySelector('a[href="/settings/profile"]')).toBeInstanceOf(
      HTMLAnchorElement,
    )
  })

  it('hides owner controls on another user profile', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'another-user'
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.profilePosts.mockResolvedValue(createConnection([]))

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('profile_username'))
    expect(view.container.textContent).not.toContain('Profile Settings')
  })

  it('loads the next eight with endCursor, deduplicates posts and stops after the last page', async () => {
    const nextPage = createDeferred<PostConnection>()
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.profilePosts
      .mockResolvedValueOnce(
        createConnection([createPost('post-1')], {
          endCursor: 'end-cursor-1',
          hasNextPage: true,
        }),
      )
      .mockReturnValueOnce(nextPage.promise)

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await triggerIntersection()

    expect(apiMocks.profilePosts).toHaveBeenCalledTimes(2)
    expect(apiMocks.profilePosts).toHaveBeenLastCalledWith({
      after: 'end-cursor-1',
      first: 8,
      userId: 'profile-user',
    })

    nextPage.resolve(createConnection([createPost('post-1'), createPost('post-2')]))

    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(2))

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(false))

    expect(apiMocks.profilePosts).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale pagination response after userId changes', async () => {
    const stalePage = createDeferred<PostConnection>()
    apiMocks.getUser.mockImplementation((id: string) =>
      Promise.resolve(createUser({ id, username: id })),
    )
    apiMocks.profilePosts
      .mockResolvedValueOnce(
        createConnection([createPost('first-user-post')], {
          endCursor: 'first-user-cursor',
          hasNextPage: true,
        }),
      )
      .mockReturnValueOnce(stalePage.promise)
      .mockResolvedValueOnce(createConnection([createPost('second-user-post')]))

    const view = renderProfile('first-user')
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()

    act(() => view.root.render(<ProfilePage userId="second-user" />))

    await waitFor(() => expect(view.container.textContent).toContain('second-user'))
    stalePage.resolve(createConnection([createPost('stale-post')]))

    await act(async () => {
      await Promise.resolve()
    })

    expect(view.container.querySelector('img[alt="second-user-post.jpg"]')).toBeInstanceOf(
      HTMLImageElement,
    )
    expect(view.container.querySelector('img[alt="stale-post.jpg"]')).toBeNull()
  })
})
