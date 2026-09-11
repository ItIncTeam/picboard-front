import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, defaultReturnToPath, getAccessToken } from '@/shared/lib/auth'

import { useOAuthAuth } from './useOAuthAuth'

const apiMocks = vi.hoisted(() => ({
  exchangeOAuthCode: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  authenticateWithCurrentToken: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
  },
}))

vi.mock('../api', () => ({
  exchangeOAuthCode: apiMocks.exchangeOAuthCode,
}))

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    authenticateWithCurrentToken: sessionMocks.authenticateWithCurrentToken,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks.router,
}))

type ProbeProps = {
  code: string | null
}

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function OAuthProbe({ code }: ProbeProps) {
  const { completeOAuthAuth } = useOAuthAuth()

  useEffect(() => {
    void completeOAuthAuth({ code })
  }, [code, completeOAuthAuth])

  return null
}

function renderOAuthProbe(code: string | null): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<OAuthProbe code={code} />)
  })

  return { container, root }
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

describe('useOAuthAuth', () => {
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
    apiMocks.exchangeOAuthCode.mockReset()
    sessionMocks.authenticateWithCurrentToken.mockReset()
    navigationMocks.router.replace.mockReset()
    clearAccessToken()
  })

  it('exchanges backend code, stores access token in memory, syncs session, and redirects to main', async () => {
    apiMocks.exchangeOAuthCode.mockResolvedValueOnce({
      accessToken: 'access-token',
      user: {
        email: 'user@example.com',
        id: 'user-id',
        isConfirmed: true,
        username: 'username',
      },
    })
    sessionMocks.authenticateWithCurrentToken.mockResolvedValueOnce(undefined)

    const view = renderOAuthProbe('backend-code')

    mountedRoots.push(view)

    await waitFor(() => {
      expect(apiMocks.exchangeOAuthCode).toHaveBeenCalledWith({ code: 'backend-code' })
      expect(getAccessToken()).toBe('access-token')
      expect(sessionMocks.authenticateWithCurrentToken).toHaveBeenCalledTimes(1)
      expect(navigationMocks.router.replace).toHaveBeenCalledWith(defaultReturnToPath)
    })
  })

  it('does not call exchangeOAuthCode when code is missing', async () => {
    const view = renderOAuthProbe(null)

    mountedRoots.push(view)

    await waitFor(() => {
      expect(apiMocks.exchangeOAuthCode).not.toHaveBeenCalled()
      expect(sessionMocks.authenticateWithCurrentToken).not.toHaveBeenCalled()
      expect(navigationMocks.router.replace).not.toHaveBeenCalled()
      expect(getAccessToken()).toBeNull()
    })
  })
})
