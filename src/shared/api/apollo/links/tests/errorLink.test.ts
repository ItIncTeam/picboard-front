import { Observable } from '@apollo/client/core'
import { ServerError } from '@apollo/client/errors'
import { ApolloLink } from '@apollo/client/link'
import { parse } from 'graphql'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeAuthSessionExpired,
} from '@/shared/lib/auth'

const refreshRequestMocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn<() => Promise<string | null>>(),
}))

vi.mock('../authRefreshRequest', () => ({
  refreshAccessToken: refreshRequestMocks.refreshAccessToken,
}))

import { clearRefreshPromise } from '../authRefreshQueue'
import { errorLink } from '../errorLink'

const createServerError = (statusCode: number): ServerError => {
  return new ServerError(`HTTP ${statusCode}`, {
    bodyText: '',
    response: new Response('', { status: statusCode }),
  })
}

type Deferred<T> = {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let rejectDeferred: Deferred<T>['reject'] | null = null
  let resolveDeferred: Deferred<T>['resolve'] | null = null

  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve
    rejectDeferred = reject
  })

  if (!resolveDeferred || !rejectDeferred) {
    throw new Error('Failed to create deferred promise.')
  }

  return {
    promise,
    reject: rejectDeferred,
    resolve: resolveDeferred,
  }
}

const createExecuteContext = (): ApolloLink.ExecuteContext => {
  return {
    client: {
      queryManager: {
        incrementalHandler: {
          extractErrors: () => undefined,
          isIncrementalResult: () => false,
        },
      },
    },
  } as unknown as ApolloLink.ExecuteContext
}

const executeLink = <TData>(
  link: ApolloLink,
  operationName: string,
  context?: Record<string, unknown>,
): Promise<TData> => {
  return new Promise<TData>((resolve, reject) => {
    ApolloLink.execute(
      link,
      {
        context,
        query: parse(`
          query ${operationName} {
            me {
              id
            }
          }
        `),
      },
      createExecuteContext(),
    ).subscribe({
      error: reject,
      next: (result) => {
        resolve(result.data as TData)
      },
    })
  })
}

const createRetryableLink = () => {
  let requestCount = 0

  const link = ApolloLink.from([
    errorLink,
    new ApolloLink(() => {
      requestCount += 1

      return new Observable<ApolloLink.Result>((observer) => {
        if (requestCount === 1) {
          observer.error(createServerError(401))

          return
        }

        observer.next({
          data: {
            me: {
              id: 'user-id',
            },
          },
        })
        observer.complete()
      })
    }),
  ])

  return {
    getRequestCount: () => requestCount,
    link,
  }
}

describe('errorLink refresh-on-401 behavior', () => {
  let authSessionExpiredCount = 0
  let unsubscribeAuthSessionExpired: (() => void) | null = null

  beforeEach(() => {
    authSessionExpiredCount = 0
    clearAccessToken()
    clearRefreshPromise()
    refreshRequestMocks.refreshAccessToken.mockReset()
    unsubscribeAuthSessionExpired = subscribeAuthSessionExpired(() => {
      authSessionExpiredCount += 1
    })
  })

  afterEach(() => {
    unsubscribeAuthSessionExpired?.()
    unsubscribeAuthSessionExpired = null
    clearAccessToken()
    clearRefreshPromise()
  })

  it('refreshes access token and retries an eligible 401 operation', async () => {
    setAccessToken('stale-access-token')
    refreshRequestMocks.refreshAccessToken.mockResolvedValueOnce('new-access-token')
    const { getRequestCount, link } = createRetryableLink()

    await expect(executeLink(link, 'Me')).resolves.toEqual({
      me: {
        id: 'user-id',
      },
    })

    expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('new-access-token')
    expect(getRequestCount()).toBe(2)
    expect(authSessionExpiredCount).toBe(0)
  })

  it('clears session and forwards the operation when refresh fails', async () => {
    let requestCount = 0

    setAccessToken('stale-access-token')
    refreshRequestMocks.refreshAccessToken.mockResolvedValueOnce(null)

    const link = ApolloLink.from([
      errorLink,
      new ApolloLink(() => {
        requestCount += 1

        return new Observable<ApolloLink.Result>((observer) => {
          observer.error(createServerError(401))
        })
      }),
    ])

    await expect(executeLink(link, 'Me')).rejects.toMatchObject({
      statusCode: 401,
    })

    expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    expect(requestCount).toBe(2)
    expect(authSessionExpiredCount).toBe(1)
  })

  it('shares one refresh request across simultaneous 401 operations', async () => {
    const deferredRefresh = createDeferred<string | null>()
    let requestCount = 0

    setAccessToken('stale-access-token')
    refreshRequestMocks.refreshAccessToken.mockReturnValueOnce(deferredRefresh.promise)

    const link = ApolloLink.from([
      errorLink,
      new ApolloLink(() => {
        requestCount += 1
        const currentRequestCount = requestCount

        return new Observable<ApolloLink.Result>((observer) => {
          if (currentRequestCount <= 2) {
            observer.error(createServerError(401))

            return
          }

          observer.next({
            data: {
              me: {
                id: `user-id-${currentRequestCount}`,
              },
            },
          })
          observer.complete()
        })
      }),
    ])

    const firstRequest = executeLink<{ me: { id: string } }>(link, 'Me')
    const secondRequest = executeLink<{ me: { id: string } }>(link, 'Me')

    await vi.waitFor(() => {
      expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    deferredRefresh.resolve('new-access-token')

    await expect(firstRequest).resolves.toEqual({
      me: {
        id: 'user-id-3',
      },
    })
    await expect(secondRequest).resolves.toEqual({
      me: {
        id: 'user-id-4',
      },
    })

    expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('new-access-token')
    expect(requestCount).toBe(4)
    expect(authSessionExpiredCount).toBe(0)
  })

  it('does not restore token or retry when session is cleared during refresh', async () => {
    const deferredRefresh = createDeferred<string | null>()
    let requestCount = 0

    setAccessToken('stale-access-token')
    refreshRequestMocks.refreshAccessToken.mockReturnValueOnce(deferredRefresh.promise)

    const link = ApolloLink.from([
      errorLink,
      new ApolloLink(() => {
        requestCount += 1

        return new Observable<ApolloLink.Result>((observer) => {
          observer.error(createServerError(401))
        })
      }),
    ])

    const request = executeLink(link, 'Me')

    await vi.waitFor(() => {
      expect(refreshRequestMocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    })

    clearAccessToken()
    deferredRefresh.resolve('new-access-token')

    await expect(request).rejects.toMatchObject({
      statusCode: 401,
    })

    expect(getAccessToken()).toBeNull()
    expect(requestCount).toBe(1)
    expect(authSessionExpiredCount).toBe(0)
  })

  it('skips refresh and invalidates session when there is no access token', async () => {
    const { getRequestCount, link } = createRetryableLink()

    await expect(executeLink(link, 'Me')).rejects.toMatchObject({
      statusCode: 401,
    })

    expect(refreshRequestMocks.refreshAccessToken).not.toHaveBeenCalled()
    expect(getRequestCount()).toBe(1)
    expect(authSessionExpiredCount).toBe(1)
  })

  it.each(['SignIn', 'Logout', 'RefreshToken'])(
    'skips refresh and invalidates session for %s operation',
    async (operationName) => {
      setAccessToken('stale-access-token')
      const { getRequestCount, link } = createRetryableLink()

      await expect(executeLink(link, operationName)).rejects.toMatchObject({
        statusCode: 401,
      })

      expect(refreshRequestMocks.refreshAccessToken).not.toHaveBeenCalled()
      expect(getRequestCount()).toBe(1)
      expect(getAccessToken()).toBeNull()
      expect(authSessionExpiredCount).toBe(1)
    },
  )

  it('skips refresh and invalidates session for already retried operation', async () => {
    setAccessToken('stale-access-token')
    const { getRequestCount, link } = createRetryableLink()

    await expect(executeLink(link, 'Me', { authRefreshRetried: true })).rejects.toMatchObject({
      statusCode: 401,
    })

    expect(refreshRequestMocks.refreshAccessToken).not.toHaveBeenCalled()
    expect(getRequestCount()).toBe(1)
    expect(getAccessToken()).toBeNull()
    expect(authSessionExpiredCount).toBe(1)
  })

  it('passes non-auth errors through without refresh or invalidation', async () => {
    setAccessToken('current-access-token')

    const link = ApolloLink.from([
      errorLink,
      new ApolloLink(() => {
        return new Observable<ApolloLink.Result>((observer) => {
          observer.error(createServerError(500))
        })
      }),
    ])

    await expect(executeLink(link, 'Me')).rejects.toMatchObject({
      statusCode: 500,
    })

    expect(refreshRequestMocks.refreshAccessToken).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe('current-access-token')
    expect(authSessionExpiredCount).toBe(0)
  })
})
