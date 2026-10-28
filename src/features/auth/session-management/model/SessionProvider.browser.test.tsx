import type { ApolloLink } from '@apollo/client/core'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { meQuery, updateProfile, writeCurrentUserCache } from '@/entities/user/current-user'
import { apolloClient } from '@/shared/api'

import { LogoutButton } from '@/features/auth/logout-button'
import {
  authRoutes,
  clearAccessToken,
  getAccessToken,
  notifyAuthSessionExpired,
  setAccessToken,
} from '@/shared/lib/auth'
import { I18nProvider } from '@/shared/lib/i18n'

import type { CurrentUser } from '../api'
import { SessionProvider } from './SessionProvider'
import type { SessionContextValue } from './types'
import { useSession } from './useSession'

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  profileRequest: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

const assetMocks = vi.hoisted(() => {
  const IconStub = () => <span />

  return {
    BellIcon: IconStub,
    Close: IconStub,
    LogOutIcon: IconStub,
    MenuIcon: IconStub,
  }
})

vi.mock('@/shared/api', async () => {
  const { ApolloClient, ApolloLink, InMemoryCache, Observable } =
    await import('@apollo/client/core')

  return {
    apolloClient: new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        (operation) =>
          new Observable((observer) => {
            void apiMocks.profileRequest(operation).then(
              (result: ApolloLink.Result) => {
                observer.next(result)
                observer.complete()
              },
              (error: unknown) => observer.error(error),
            )
          }),
      ),
    }),
  }
})

vi.mock('../api', () => ({
  getMe: apiMocks.getMe,
  logout: apiMocks.logout,
  refreshToken: apiMocks.refreshToken,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
}))

vi.mock('next/image', () => ({
  default: () => null,
}))

vi.mock('@/shared/assets', () => assetMocks)

const user: CurrentUser & { __typename: string } = {
  __typename: 'Me',
  aboutMe: null,
  avatar: null,
  city: null,
  cityId: null,
  country: null,
  countryId: null,
  dateOfBirth: null,
  displayName: null,
  email: 'user@example.com',
  firstName: null,
  id: 'user-id',
  isConfirmed: true,
  lastName: null,
  profilePictureFileId: null,
  username: 'username',
}

type RenderResult = {
  container: HTMLDivElement
  getLatestSession: () => SessionContextValue | null
  root: Root
}

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolveDeferred: ((value: T) => void) | null = null
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve
  })

  if (!resolveDeferred) {
    throw new Error('Failed to create deferred promise.')
  }

  return { promise, resolve: resolveDeferred }
}

function SessionProbe({ onSession }: { onSession: (session: SessionContextValue) => void }) {
  const session = useSession()

  useEffect(() => {
    onSession(session)
  }, [onSession, session])

  return <LogoutButton />
}

function renderSessionProvider(): RenderResult {
  let latestSession: SessionContextValue | null = null
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <SessionProvider>
          <SessionProbe
            onSession={(session) => {
              latestSession = session
            }}
          />
        </SessionProvider>
      </I18nProvider>,
    )
  })

  return {
    container,
    getLatestSession: () => latestSession,
    root,
  }
}

async function waitFor(assertion: () => void): Promise<void> {
  const timeoutAt = Date.now() + 1000
  let lastError: unknown

  while (Date.now() < timeoutAt) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
      })
    }
  }

  throw lastError
}

describe('SessionProvider auth flow', () => {
  let mountedRoots: RenderResult[] = []

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

    mountedRoots = []
    apolloClient.cache.restore({})
    apiMocks.profileRequest.mockReset()
    apiMocks.getMe.mockReset()
    apiMocks.logout.mockReset()
    apiMocks.refreshToken.mockReset()
    navigationMocks.replace.mockReset()
    clearAccessToken()
  })

  it('authenticates when refreshToken and me both succeed during bootstrap', async () => {
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockResolvedValueOnce(user)

    const view = renderSessionProvider()

    mountedRoots.push(view)

    await waitFor(() => {
      expect(view.getLatestSession()?.status).toBe('authenticated')
    })

    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('access-token')
    expect(view.getLatestSession()?.user).toEqual(user)
    expect(apiMocks.refreshToken.mock.invocationCallOrder[0]).toBeLessThan(
      apiMocks.getMe.mock.invocationCallOrder[0],
    )
  })

  it('moves to anonymous when refreshToken fails during bootstrap', async () => {
    setAccessToken('stale-token')
    apiMocks.refreshToken.mockRejectedValueOnce(new Error('Unauthorized'))

    const view = renderSessionProvider()

    mountedRoots.push(view)

    await waitFor(() => {
      expect(view.getLatestSession()?.status).toBe('anonymous')
    })

    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
    expect(apiMocks.getMe).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
    expect(view.getLatestSession()?.user).toBeNull()
  })

  it('moves to anonymous when me fails after refreshToken succeeds during bootstrap', async () => {
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockRejectedValueOnce(new Error('Unauthorized'))

    const view = renderSessionProvider()

    mountedRoots.push(view)

    await waitFor(() => {
      expect(view.getLatestSession()?.status).toBe('anonymous')
    })

    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    expect(view.getLatestSession()?.user).toBeNull()
  })

  it('deduplicates concurrent refresh calls and sets the token before loading Me', async () => {
    const refresh = createDeferred<{ accessToken: string }>()

    apiMocks.refreshToken.mockReturnValueOnce(refresh.promise)
    apiMocks.getMe.mockImplementationOnce(async () => {
      expect(getAccessToken()).toBe('refreshed-token')
      return user
    })

    const view = renderSessionProvider()

    mountedRoots.push(view)

    const session = view.getLatestSession()
    const firstRefresh = session?.refreshSession()
    const secondRefresh = session?.refreshSession()

    expect(firstRefresh).toBeInstanceOf(Promise)
    expect(firstRefresh).toBe(secondRefresh)
    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
    expect(apiMocks.getMe).not.toHaveBeenCalled()

    await act(async () => {
      refresh.resolve({ accessToken: 'refreshed-token' })
      await firstRefresh
    })

    expect(view.getLatestSession()?.status).toBe('authenticated')
    expect(view.getLatestSession()?.user).toEqual(user)
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
  })

  it('syncs sign-in using the current token without another refresh', async () => {
    apiMocks.refreshToken.mockRejectedValueOnce(new Error('No refresh cookie'))

    const view = renderSessionProvider()

    mountedRoots.push(view)

    await waitFor(() => {
      expect(view.getLatestSession()?.status).toBe('anonymous')
    })

    apiMocks.getMe.mockResolvedValueOnce(user)
    setAccessToken('sign-in-token')

    await act(async () => {
      await view.getLatestSession()?.authenticateWithCurrentToken()
    })

    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('sign-in-token')
    expect(view.getLatestSession()?.user).toEqual(user)
    expect(view.getLatestSession()?.status).toBe('authenticated')
  })

  it('discards a stale bootstrap result after sign-in', async () => {
    const refresh = createDeferred<{ accessToken: string }>()

    apiMocks.refreshToken.mockReturnValueOnce(refresh.promise)
    apiMocks.getMe.mockResolvedValueOnce(user)

    const view = renderSessionProvider()

    mountedRoots.push(view)
    setAccessToken('sign-in-token')

    await act(async () => {
      await view.getLatestSession()?.authenticateWithCurrentToken()
      refresh.resolve({ accessToken: 'stale-bootstrap-token' })
      await refresh.promise
    })

    expect(getAccessToken()).toBe('sign-in-token')
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(view.getLatestSession()?.status).toBe('authenticated')
    expect(view.getLatestSession()?.user).toEqual(user)
  })

  it('clears the session when the auth layer reports expiration', async () => {
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockResolvedValueOnce(user)

    const view = renderSessionProvider()

    mountedRoots.push(view)

    await waitFor(() => {
      expect(view.getLatestSession()?.status).toBe('authenticated')
    })

    act(() => {
      notifyAuthSessionExpired()
    })

    expect(getAccessToken()).toBeNull()
    expect(view.getLatestSession()?.status).toBe('anonymous')
    expect(view.getLatestSession()?.user).toBeNull()
  })

  it.each([false, true])(
    'clears the local session and redirects on logout (API fails: %s)',
    async (fails) => {
      apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
      apiMocks.getMe.mockResolvedValueOnce(user)
      if (fails) {
        apiMocks.logout.mockRejectedValueOnce(new Error('Internal server error'))
      } else {
        apiMocks.logout.mockResolvedValueOnce('Logged out')
      }

      const view = renderSessionProvider()

      mountedRoots.push(view)

      await waitFor(() => {
        expect(view.getLatestSession()?.status).toBe('authenticated')
      })

      const logoutButton = view.container.querySelector('button[aria-label="Sign out"]')

      expect(logoutButton).toBeInstanceOf(HTMLButtonElement)

      act(() => {
        logoutButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      await waitFor(() => {
        expect(apiMocks.logout).toHaveBeenCalledTimes(1)
        expect(view.getLatestSession()?.status).toBe('anonymous')
        expect(navigationMocks.replace).toHaveBeenCalledWith(authRoutes.signIn)
      })

      expect(getAccessToken()).toBeNull()
      expect(view.getLatestSession()?.user).toBeNull()
    },
  )
  async function authenticatedView(initialUser = user): Promise<RenderResult> {
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockResolvedValueOnce(initialUser)
    const view = renderSessionProvider()
    mountedRoots.push(view)
    await waitFor(() => expect(view.getLatestSession()?.status).toBe('authenticated'))
    writeCurrentUserCache(initialUser)
    return view
  }

  const input = { username: 'updated_name', firstName: 'Updated', lastName: 'Name' }

  it.each([
    {
      ...user,
      username: 'updated_name',
      firstName: 'Updated',
      lastName: 'Name',
      displayName: 'Updated Name',
      aboutMe: '',
      country: { id: 'country', code: 'DE', name: 'Germany', nameRu: null },
      countryId: 'country',
    },
    { ...user, username: 'updated_name' },
  ])('synchronizes the returned read-model with no extra requests: %j', async (updated) => {
    const view = await authenticatedView({
      ...user,
      aboutMe: 'Old bio',
      dateOfBirth: '2000-01-01',
      countryId: 'old',
      country: { id: 'old', code: 'US', name: 'USA', nameRu: 'США' },
      cityId: 'old-city',
      city: { id: 'old-city', name: 'Old city', nameRu: null },
      avatar: { id: 'old-avatar', url: 'https://example.com/old.jpg' },
      profilePictureFileId: 'old-avatar',
    })
    const synchronize = view.getLatestSession()!.createCurrentUserSynchronizer()
    apiMocks.profileRequest.mockResolvedValueOnce({
      data: { updateProfile: updated },
    })
    await act(async () => {
      const returned = await updateProfile(input)
      expect(synchronize(returned)).toBe(true)
    })
    expect(view.getLatestSession()?.user).toMatchObject(updated)
    expect(apolloClient.readQuery({ query: meQuery })).toMatchObject({ me: updated })
    expect(getAccessToken()).toBe('access-token')
    expect(apiMocks.profileRequest).toHaveBeenCalledTimes(1)
    expect(apiMocks.profileRequest.mock.calls[0][0].operationName).toBe('UpdateProfile')
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
  })

  it.each([
    { name: 'network', response: new Error('Offline') },
    { name: 'graphql', response: { errors: [{ message: 'Username taken' }] } },
    { name: 'missing', response: { data: { updateProfile: null } } },
    {
      name: 'partial',
      response: {
        data: { updateProfile: { ...user, username: 'must-not-write' } },
        errors: [{ message: 'Username taken', extensions: { code: 'USERNAME_TAKEN' } }],
      },
    },
  ])('leaves both states unchanged on $name failure', async ({ response }) => {
    const view = await authenticatedView()
    const snapshot = apolloClient.cache.extract()
    const synchronize = view.getLatestSession()!.createCurrentUserSynchronizer()
    apiMocks.profileRequest.mockImplementationOnce(async () => {
      if (response instanceof Error) throw response
      return response
    })
    await expect(updateProfile(input).then(synchronize)).rejects.toThrow()
    expect(view.getLatestSession()?.user).toEqual(user)
    expect(apolloClient.cache.extract()).toEqual(snapshot)
    expect(getAccessToken()).toBe('access-token')
  })

  it.each<{
    name: string
    transition: (session: SessionContextValue) => void | Promise<void>
  }>([
    {
      name: 'logout-pending',
      transition: (session) => {
        apiMocks.logout.mockReturnValueOnce(new Promise(() => {}))
        void session.logout()
        expect(
          session.createCurrentUserSynchronizer()({ ...user, username: 'during-logout' }),
        ).toBe(false)
      },
    },
    {
      name: 'logout',
      transition: (session) => {
        apiMocks.logout.mockResolvedValueOnce('Logged out')
        return session.logout()
      },
    },
    { name: 'anonymous', transition: (session) => session.setAnonymousSession() },
    { name: 'expiration', transition: () => notifyAuthSessionExpired() },
    {
      name: 'same-user-login',
      transition: (session) => {
        setAccessToken('new-login-token')
        apiMocks.getMe.mockResolvedValueOnce(user)
        return session.authenticateWithCurrentToken()
      },
    },
    {
      name: 'different-user-login',
      transition: async (session) => {
        const nextUser = { ...user, id: 'other-user' }
        setAccessToken('new-login-token')
        apiMocks.getMe.mockResolvedValueOnce(nextUser)
        await session.authenticateWithCurrentToken()
        writeCurrentUserCache(nextUser)
      },
    },
    {
      name: 'token-change',
      transition: () => {
        setAccessToken('replacement-token')
      },
    },
    {
      name: 'refresh',
      transition: (session) => {
        apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'new-restore-token' })
        apiMocks.getMe.mockResolvedValueOnce(user)
        return session.refreshSession()
      },
    },
  ])('discards late mutation results after $name', async ({ transition }) => {
    const view = await authenticatedView()
    const response = createDeferred<{ data: { updateProfile: CurrentUser } }>()
    const synchronize = view.getLatestSession()!.createCurrentUserSynchronizer()
    apiMocks.profileRequest.mockReturnValueOnce(response.promise)
    const result = updateProfile(input).then(synchronize)
    await act(async () => {
      await transition(view.getLatestSession()!)
    })
    const snapshot = apolloClient.cache.extract()
    const sessionBefore = view.getLatestSession()
    const tokenBefore = getAccessToken()
    await act(async () => {
      response.resolve({
        data: { updateProfile: { ...user, username: 'late-response' } },
      })
      expect(await result).toBe(false)
    })
    expect(apolloClient.cache.extract()).toEqual(snapshot)
    expect(view.getLatestSession()?.user).toEqual(sessionBefore?.user)
    expect(getAccessToken()).toBe(tokenBefore)
  })

  it('does not let an older callback or a replay overwrite a newer synchronized profile', async () => {
    const view = await authenticatedView()
    const older = view.getLatestSession()!.createCurrentUserSynchronizer()
    const newer = view.getLatestSession()!.createCurrentUserSynchronizer()
    const updated = { ...user, username: 'newer-profile' }

    act(() => {
      expect(newer(updated)).toBe(true)
    })

    const snapshot = apolloClient.cache.extract()
    act(() => {
      expect(older({ ...user, username: 'older-profile' })).toBe(false)
      expect(newer(user)).toBe(false)
    })

    expect(view.getLatestSession()?.user).toEqual(updated)
    expect(apolloClient.cache.extract()).toEqual(snapshot)
    expect(getAccessToken()).toBe('access-token')
    expect(apiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(apiMocks.refreshToken).toHaveBeenCalledTimes(1)
  })

  it('rejects a different user response', async () => {
    const view = await authenticatedView()
    const snapshot = apolloClient.cache.extract()
    expect(view.getLatestSession()!.createCurrentUserSynchronizer()({ ...user, id: 'other' })).toBe(
      false,
    )
    expect(view.getLatestSession()?.user).toEqual(user)
    expect(apolloClient.cache.extract()).toEqual(snapshot)
  })

  it('rejects anonymous and bootstrap callbacks even after later sign-in', async () => {
    const refresh = createDeferred<{ accessToken: string }>()
    apiMocks.refreshToken.mockReturnValueOnce(refresh.promise)
    const view = renderSessionProvider()
    mountedRoots.push(view)
    const bootstrapSync = view.getLatestSession()!.createCurrentUserSynchronizer()
    expect(bootstrapSync(user)).toBe(false)
    await act(async () => {
      view.getLatestSession()!.setAnonymousSession()
      refresh.resolve({ accessToken: 'stale' })
      await refresh.promise
    })
    const anonymousSync = view.getLatestSession()!.createCurrentUserSynchronizer()
    expect(anonymousSync(user)).toBe(false)
    setAccessToken('login-token')
    apiMocks.getMe.mockResolvedValueOnce(user)
    await act(async () => {
      await view.getLatestSession()!.authenticateWithCurrentToken()
    })
    expect(anonymousSync(user)).toBe(false)
    expect(bootstrapSync(user)).toBe(false)
    expect(apolloClient.cache.extract()).toEqual({})
  })

  it('rejects results after provider unmount', async () => {
    const view = await authenticatedView()
    const synchronize = view.getLatestSession()!.createCurrentUserSynchronizer()
    act(() => view.root.unmount())
    view.container.remove()
    mountedRoots = mountedRoots.filter((entry) => entry !== view)
    const snapshot = apolloClient.cache.extract()
    expect(synchronize({ ...user, username: 'late' })).toBe(false)
    expect(apolloClient.cache.extract()).toEqual(snapshot)
  })

  it('does not restore a pending Me result after expiration', async () => {
    const pendingMe = createDeferred<CurrentUser>()
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockReturnValueOnce(pendingMe.promise)
    const view = renderSessionProvider()
    mountedRoots.push(view)
    await waitFor(() => expect(apiMocks.getMe).toHaveBeenCalledTimes(1))
    await act(async () => {
      notifyAuthSessionExpired()
      pendingMe.resolve(user)
      await pendingMe.promise
    })
    expect(view.getLatestSession()?.status).toBe('anonymous')
    expect(getAccessToken()).toBeNull()
  })
})
