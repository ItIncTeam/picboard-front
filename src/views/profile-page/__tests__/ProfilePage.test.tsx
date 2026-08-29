import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type { PostConnection, PostEntity, ProfilePostsQueryData } from '@/entities/post'
import type { PublicUser } from '@/entities/user'
import { I18nProvider } from '@/shared/lib/i18n'

import { ProfilePage } from '../ProfilePage'

const apiMocks = vi.hoisted(() => ({
  fetchMore: vi.fn(),
  getUser: vi.fn(),
  refetch: vi.fn(),
  result: null as unknown as {
    data?: ProfilePostsQueryData
    error?: Error
    fetchMore: ReturnType<typeof vi.fn>
    loading: boolean
    refetch: ReturnType<typeof vi.fn>
    variables: { input: { first: number; userId: string } }
  },
  useQuery: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  status: 'anonymous' as 'anonymous' | 'authenticated' | 'bootstrapping',
  userId: null as string | null,
}))

vi.mock('@/entities/user', () => ({
  getUser: apiMocks.getUser,
}))

vi.mock('@apollo/client/react', () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: (...args: unknown[]) => {
    apiMocks.useQuery(...args)
    return apiMocks.result
  },
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
  reject: (reason?: unknown) => void
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
  let rejectPromise: ((reason?: unknown) => void) | undefined
  let resolvePromise: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve, reject) => {
    rejectPromise = reject
    resolvePromise = resolve
  })

  return {
    promise,
    reject: (reason) => rejectPromise?.(reason),
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
  act(() =>
    root.render(
      <I18nProvider>
        <ProfilePage userId={userId} />
      </I18nProvider>,
    ),
  )

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
    apiMocks.fetchMore.mockReset()
    apiMocks.getUser.mockReset()
    apiMocks.refetch.mockReset()
    apiMocks.refetch.mockResolvedValue(undefined)
    apiMocks.result = {
      data: { profilePosts: createConnection([]) },
      fetchMore: apiMocks.fetchMore,
      loading: false,
      refetch: apiMocks.refetch,
      variables: { input: { first: 8, userId: 'profile-user' } },
    }
    apiMocks.useQuery.mockReset()
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
    apiMocks.result = {
      fetchMore: apiMocks.fetchMore,
      loading: true,
      refetch: apiMocks.refetch,
      variables: { input: { first: 8, userId: 'profile-user' } },
    }

    const view = renderProfile()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Loading profile...')
    expect(view.container.querySelector('[aria-label="Loading publications"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(apiMocks.useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notifyOnNetworkStatusChange: false,
        pollInterval: 60_000,
        variables: { input: { first: 8, userId: 'profile-user' } },
      }),
    )
  })

  it('renders public user data without exposing email and shows empty posts state', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())

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
    apiMocks.result.data = {
      profilePosts: createConnection([createPost('newest-post'), createPost('older-post')]),
    }

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
    const retryError = new Error('Profile posts still unavailable')
    apiMocks.getUser
      .mockRejectedValueOnce(new Error('Profile unavailable'))
      .mockResolvedValueOnce(createUser())
    apiMocks.refetch.mockRejectedValueOnce(retryError)

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() =>
      expect(view.container.textContent).toContain('Profile loading failed. Please try again.'),
    )

    act(() => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again')
        ?.click()
    })

    await waitFor(() => expect(view.container.textContent).toContain('profile_username'))
    expect(apiMocks.getUser).toHaveBeenCalledTimes(2)
    expect(apiMocks.refetch).toHaveBeenCalledTimes(1)
  })

  it('shows Profile Settings only to the profile owner', async () => {
    sessionMocks.status = 'authenticated'
    sessionMocks.userId = 'profile-user'
    apiMocks.getUser.mockResolvedValue(createUser())

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

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(view.container.textContent).toContain('profile_username'))
    expect(view.container.textContent).not.toContain('Profile Settings')
  })

  it('loads the next eight with endCursor, deduplicates posts and stops after the last page', async () => {
    const nextPage = createDeferred<PostConnection>()
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection([createPost('post-1')], {
        endCursor: 'end-cursor-1',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore.mockReturnValueOnce(
      nextPage.promise.then((profilePosts) => ({ data: { profilePosts } })),
    )

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await triggerIntersection()

    expect(apiMocks.fetchMore).toHaveBeenCalledTimes(1)
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'end-cursor-1', first: 8, userId: 'profile-user' },
      },
    })

    nextPage.resolve(createConnection([createPost('post-1'), createPost('post-2')]))

    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(2))

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(false))

    expect(apiMocks.fetchMore).toHaveBeenCalledTimes(1)
  })

  it('preserves a post displaced from the first-page boundary and rebuilds the cursor chain', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost), {
        endCursor: 'old-first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection(['2', '1'].map(createPost), {
            endCursor: 'old-deepest-cursor',
            hasNextPage: true,
          }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection(['4', '3', '2', '1'].map(createPost), {
            endCursor: 'new-chain-cursor',
            hasNextPage: true,
          }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection([createPost('1')]),
        },
      })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(10))

    apiMocks.result.data = {
      profilePosts: createConnection(['11', '10', '9', '8', '7', '6', '5', '4'].map(createPost), {
        endCursor: 'new-first-page-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    expect(
      Array.from(view.container.querySelectorAll('article img')).map((image) =>
        image.getAttribute('alt'),
      ),
    ).toEqual([
      '11.jpg',
      '10.jpg',
      '9.jpg',
      '8.jpg',
      '7.jpg',
      '6.jpg',
      '5.jpg',
      '4.jpg',
      '3.jpg',
      '2.jpg',
      '1.jpg',
    ])

    await triggerIntersection()
    await waitFor(() => expect(apiMocks.fetchMore).toHaveBeenCalledTimes(2))
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'new-first-page-cursor', first: 8, userId: 'profile-user' },
      },
    })
    expect(view.container.querySelectorAll('article')).toHaveLength(11)

    await triggerIntersection()
    await waitFor(() => expect(apiMocks.fetchMore).toHaveBeenCalledTimes(3))
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'new-chain-cursor', first: 8, userId: 'profile-user' },
      },
    })
  })

  it('preserves every displaced post when multiple posts are inserted at the head', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost), {
        endCursor: 'old-first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore.mockResolvedValueOnce({
      data: {
        profilePosts: createConnection(['2', '1'].map(createPost), {
          endCursor: 'old-deepest-cursor',
          hasNextPage: true,
        }),
      },
    })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(10))

    apiMocks.result.data = {
      profilePosts: createConnection(['13', '12', '11', '10', '9', '8', '7', '6'].map(createPost), {
        endCursor: 'new-first-page-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    expect(
      Array.from(view.container.querySelectorAll('article img')).map((image) =>
        image.getAttribute('alt'),
      ),
    ).toEqual([
      '13.jpg',
      '12.jpg',
      '11.jpg',
      '10.jpg',
      '9.jpg',
      '8.jpg',
      '7.jpg',
      '6.jpg',
      '5.jpg',
      '4.jpg',
      '3.jpg',
      '2.jpg',
      '1.jpg',
    ])
  })

  it('preserves order without duplicates across consecutive first-page polls', async () => {
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost), {
        endCursor: 'initial-first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore.mockResolvedValueOnce({
      data: {
        profilePosts: createConnection(['2', '1'].map(createPost), {
          endCursor: 'initial-deepest-cursor',
          hasNextPage: true,
        }),
      },
    })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(10))

    apiMocks.result.data = {
      profilePosts: createConnection(['11', '10', '9', '8', '7', '6', '5', '4'].map(createPost), {
        endCursor: 'first-poll-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    apiMocks.result.data = {
      profilePosts: createConnection(['12', '11', '10', '9', '8', '7', '6', '5'].map(createPost), {
        endCursor: 'second-poll-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    expect(
      Array.from(view.container.querySelectorAll('article img')).map((image) =>
        image.getAttribute('alt'),
      ),
    ).toEqual([
      '12.jpg',
      '11.jpg',
      '10.jpg',
      '9.jpg',
      '8.jpg',
      '7.jpg',
      '6.jpg',
      '5.jpg',
      '4.jpg',
      '3.jpg',
      '2.jpg',
      '1.jpg',
    ])
  })

  it('refreshes the reconciliation snapshot without resetting pagination for the same ids', async () => {
    const initialPosts = ['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost)
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(initialPosts, {
        endCursor: 'first-page-cursor',
        hasNextPage: true,
      }),
    }

    const view = renderProfile()
    mountedRoots.push(view)
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(8))

    const refreshedBoundaryPost = createPost('3')
    const refreshedBoundaryAttachment = refreshedBoundaryPost.attachments[0]

    if (!refreshedBoundaryAttachment?.file) {
      throw new Error('Expected the post fixture to contain an image attachment.')
    }

    refreshedBoundaryAttachment.file.originalName = '3-refreshed.jpg'
    apiMocks.result.data = {
      profilePosts: createConnection([...initialPosts.slice(0, -1), refreshedBoundaryPost], {
        endCursor: 'same-head-new-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    apiMocks.result.data = {
      profilePosts: createConnection(['11', '10', '9', '8', '7', '6', '5', '4'].map(createPost), {
        endCursor: 'changed-head-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    expect(view.container.querySelector('img[alt="3-refreshed.jpg"]')).toBeInstanceOf(
      HTMLImageElement,
    )
    expect(view.container.querySelector('img[alt="3.jpg"]')).toBeNull()
  })

  it('keeps the deepest cursor when a poll returns the same first-page ids in the same order', async () => {
    const firstPagePosts = ['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost)
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(firstPagePosts, {
        endCursor: 'first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection(['2', '1'].map(createPost), {
            endCursor: 'deepest-cursor',
            hasNextPage: true,
          }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection([createPost('1')]),
        },
      })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(10))

    apiMocks.result.data = {
      profilePosts: createConnection(firstPagePosts, {
        endCursor: 'same-head-new-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    await triggerIntersection()

    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'deepest-cursor', first: 8, userId: 'profile-user' },
      },
    })
    expect(view.container.querySelectorAll('article')).toHaveLength(10)
  })

  it('ignores an old-chain fetchMore response when the first page changes concurrently', async () => {
    const oldChainPage = createDeferred<PostConnection>()
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost), {
        endCursor: 'old-first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore
      .mockReturnValueOnce(
        oldChainPage.promise.then((profilePosts) => ({ data: { profilePosts } })),
      )
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection([createPost('2')]),
        },
      })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()

    apiMocks.result.data = {
      profilePosts: createConnection(['11', '10', '9', '8', '7', '6', '5', '4'].map(createPost), {
        endCursor: 'new-first-page-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    await triggerIntersection()
    await waitFor(() => expect(apiMocks.fetchMore).toHaveBeenCalledTimes(2))
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'new-first-page-cursor', first: 8, userId: 'profile-user' },
      },
    })

    oldChainPage.resolve(createConnection([createPost('stale-old-chain-post')]))
    await act(async () => {
      await Promise.resolve()
    })

    expect(view.container.querySelector('img[alt="stale-old-chain-post.jpg"]')).toBeNull()
    expect(view.container.textContent).not.toContain('Loading more publications...')
  })

  it('ignores an old-chain fetchMore rejection without clearing the new revision loading guard', async () => {
    const oldChainPage = createDeferred<PostConnection>()
    const newChainPage = createDeferred<PostConnection>()
    apiMocks.getUser.mockResolvedValue(createUser())
    apiMocks.result.data = {
      profilePosts: createConnection(['10', '9', '8', '7', '6', '5', '4', '3'].map(createPost), {
        endCursor: 'old-first-page-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore
      .mockReturnValueOnce(
        oldChainPage.promise.then((profilePosts) => ({ data: { profilePosts } })),
      )
      .mockReturnValueOnce(
        newChainPage.promise.then((profilePosts) => ({ data: { profilePosts } })),
      )
      .mockResolvedValueOnce({
        data: { profilePosts: createConnection([createPost('1')]) },
      })

    const view = renderProfile()
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()

    apiMocks.result.data = {
      profilePosts: createConnection(['11', '10', '9', '8', '7', '6', '5', '4'].map(createPost), {
        endCursor: 'new-first-page-cursor',
        hasNextPage: true,
      }),
    }
    act(() => view.root.render(<ProfilePage userId="profile-user" />))

    await triggerIntersection()
    await waitFor(() => expect(apiMocks.fetchMore).toHaveBeenCalledTimes(2))
    expect(view.container.textContent).toContain('Loading more publications...')

    oldChainPage.reject(new Error('Old cursor is no longer valid'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(view.container.textContent).toContain('Loading more publications...')
    expect(view.container.textContent).not.toContain('Old cursor is no longer valid')
    expect(apiMocks.fetchMore).toHaveBeenCalledTimes(2)

    newChainPage.resolve(
      createConnection(['4', '3', '2'].map(createPost), {
        endCursor: 'new-chain-cursor',
        hasNextPage: true,
      }),
    )
    await waitFor(() =>
      expect(view.container.textContent).not.toContain('Loading more publications...'),
    )

    expect(
      Array.from(view.container.querySelectorAll('article img')).map((image) =>
        image.getAttribute('alt'),
      ),
    ).toEqual([
      '11.jpg',
      '10.jpg',
      '9.jpg',
      '8.jpg',
      '7.jpg',
      '6.jpg',
      '5.jpg',
      '4.jpg',
      '3.jpg',
      '2.jpg',
    ])

    await triggerIntersection()
    await waitFor(() => expect(apiMocks.fetchMore).toHaveBeenCalledTimes(3))
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'new-chain-cursor', first: 8, userId: 'profile-user' },
      },
    })
  })

  it('clears pagination history when userId changes and paginates from the new user cursor', async () => {
    apiMocks.getUser.mockImplementation((id: string) =>
      Promise.resolve(createUser({ id, username: id })),
    )
    apiMocks.result.data = {
      profilePosts: createConnection([createPost('user-a-first')], {
        endCursor: 'user-a-first-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection([createPost('user-a-history')], {
            endCursor: 'user-a-deepest-cursor',
            hasNextPage: true,
          }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          profilePosts: createConnection([createPost('user-b-history')]),
        },
      })
    apiMocks.result.variables = { input: { first: 8, userId: 'user-a' } }

    const view = renderProfile('user-a')
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()
    await waitFor(() => expect(view.container.querySelectorAll('article')).toHaveLength(2))

    apiMocks.result.data = {
      profilePosts: createConnection([createPost('user-b-first')], {
        endCursor: 'user-b-first-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.result.variables = { input: { first: 8, userId: 'user-b' } }
    act(() => view.root.render(<ProfilePage userId="user-b" />))

    await waitFor(() => expect(view.container.textContent).toContain('user-b'))
    expect(view.container.querySelector('img[alt="user-a-history.jpg"]')).toBeNull()

    await triggerIntersection()
    expect(apiMocks.fetchMore).toHaveBeenLastCalledWith({
      variables: {
        input: { after: 'user-b-first-cursor', first: 8, userId: 'user-b' },
      },
    })
  })

  it('ignores a stale pagination response after userId changes', async () => {
    const stalePage = createDeferred<PostConnection>()
    apiMocks.getUser.mockImplementation((id: string) =>
      Promise.resolve(createUser({ id, username: id })),
    )
    apiMocks.result.data = {
      profilePosts: createConnection([createPost('first-user-post')], {
        endCursor: 'first-user-cursor',
        hasNextPage: true,
      }),
    }
    apiMocks.fetchMore.mockReturnValueOnce(
      stalePage.promise.then((profilePosts) => ({ data: { profilePosts } })),
    )
    apiMocks.result.variables = { input: { first: 8, userId: 'first-user' } }

    const view = renderProfile('first-user')
    mountedRoots.push(view)

    await waitFor(() => expect(observerRecords.some(({ active }) => active)).toBe(true))
    await triggerIntersection()

    apiMocks.result.data = {
      profilePosts: createConnection([createPost('second-user-post')]),
    }
    apiMocks.result.variables = { input: { first: 8, userId: 'second-user' } }
    act(() =>
      view.root.render(
        <I18nProvider>
          <ProfilePage userId="second-user" />
        </I18nProvider>,
      ),
    )

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
