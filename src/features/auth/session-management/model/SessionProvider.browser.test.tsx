import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoutButton } from '@/features/auth'
import { authRoutes, clearAccessToken, getAccessToken, setAccessToken } from '@/shared/lib/auth'

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

const user = {
  bio: null,
  displayName: null,
  email: 'user@example.com',
  id: 'user-id',
  isConfirmed: true,
  profilePictureFileId: null,
  username: 'username',
}

type RenderResult = {
  container: HTMLDivElement
  getLatestSession: () => SessionContextValue | null
  root: Root
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
      <SessionProvider>
        <SessionProbe
          onSession={(session) => {
            latestSession = session
          }}
        />
      </SessionProvider>,
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

  it('logs out by calling logout, clearing accessToken, moving anonymous, and redirecting', async () => {
    apiMocks.refreshToken.mockResolvedValueOnce({ accessToken: 'access-token' })
    apiMocks.getMe.mockResolvedValueOnce(user)
    apiMocks.logout.mockResolvedValueOnce('Logged out')

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
  })
})
