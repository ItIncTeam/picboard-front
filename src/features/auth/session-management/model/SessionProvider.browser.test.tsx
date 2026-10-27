import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

const user: CurrentUser = {
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
})
