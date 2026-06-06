import type { ApolloLink } from '@apollo/client/link'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getTokenVersion, setAccessToken } from '@/shared/lib/auth'

const refreshRequestMocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn<() => Promise<string | null>>(),
}))

vi.mock('../authRefreshRequest', () => ({
  refreshAccessToken: refreshRequestMocks.refreshAccessToken,
}))

import {
  clearRefreshPromise,
  getOrCreateRefreshPromise,
  hasAlreadyRetried,
  isRefreshEligible,
  markRetried,
} from '../authRefreshQueue'

type TestOperation = Pick<ApolloLink.Operation, 'getContext' | 'operationName' | 'setContext'>

function createOperation(operationName: string | undefined): ApolloLink.Operation {
  let context: Record<string, unknown> = {}

  const operation: TestOperation = {
    getContext: () => context,
    operationName,
    setContext: (nextContext) => {
      const resolvedContext = typeof nextContext === 'function' ? nextContext(context) : nextContext

      context = {
        ...context,
        ...resolvedContext,
      }
    },
  }

  return operation as ApolloLink.Operation
}

describe('auth refresh queue', () => {
  beforeEach(() => {
    clearRefreshPromise()
    clearAccessToken()
    refreshRequestMocks.refreshAccessToken.mockReset()
  })

  afterEach(() => {
    clearRefreshPromise()
    clearAccessToken()
  })

  describe('isRefreshEligible', () => {
    it('returns false when there is no access token', () => {
      const operation = createOperation('Me')

      expect(isRefreshEligible(operation, false)).toBe(false)
    })

    it('returns false for SignIn operation', () => {
      const operation = createOperation('SignIn')

      expect(isRefreshEligible(operation, true)).toBe(false)
    })

    it('returns false for Logout operation', () => {
      const operation = createOperation('Logout')

      expect(isRefreshEligible(operation, true)).toBe(false)
    })

    it('returns false for RefreshToken operation', () => {
      const operation = createOperation('RefreshToken')

      expect(isRefreshEligible(operation, true)).toBe(false)
    })

    it('returns false when operation was already retried', () => {
      const operation = createOperation('Me')

      markRetried(operation)

      expect(isRefreshEligible(operation, true)).toBe(false)
    })

    it('returns true for an authenticated operation that was not retried', () => {
      const operation = createOperation('Me')

      expect(isRefreshEligible(operation, true)).toBe(true)
    })
  })

  describe('retry flag', () => {
    it('sets and reads retry flag', () => {
      const operation = createOperation('Me')

      expect(hasAlreadyRetried(operation)).toBe(false)

      markRetried(operation)

      expect(hasAlreadyRetried(operation)).toBe(true)
    })
  })

  describe('getOrCreateRefreshPromise', () => {
    it('returns the same promise for concurrent calls', () => {
      refreshRequestMocks.refreshAccessToken.mockResolvedValueOnce('new-access-token')

      const firstPromise = getOrCreateRefreshPromise()
      const secondPromise = getOrCreateRefreshPromise()

      expect(firstPromise).toBe(secondPromise)
      expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('creates a new promise after the previous promise settled', async () => {
      refreshRequestMocks.refreshAccessToken
        .mockResolvedValueOnce('first-access-token')
        .mockResolvedValueOnce('second-access-token')

      await expect(getOrCreateRefreshPromise()).resolves.toMatchObject({
        token: 'first-access-token',
      })
      await expect(getOrCreateRefreshPromise()).resolves.toMatchObject({
        token: 'second-access-token',
      })

      expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(2)
    })

    it('resolves null when refreshAccessToken returns null', async () => {
      refreshRequestMocks.refreshAccessToken.mockResolvedValueOnce(null)

      await expect(getOrCreateRefreshPromise()).resolves.toBeNull()
    })

    it('captures token version when refresh starts', async () => {
      setAccessToken('stale-access-token')
      const versionAtRefreshStart = getTokenVersion()
      refreshRequestMocks.refreshAccessToken.mockResolvedValueOnce('new-access-token')

      const refreshResultPromise = getOrCreateRefreshPromise()

      clearAccessToken()

      await expect(refreshResultPromise).resolves.toEqual({
        token: 'new-access-token',
        version: versionAtRefreshStart,
      })
      expect(getTokenVersion()).not.toBe(versionAtRefreshStart)
    })
  })
})
