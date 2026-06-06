import { Observable } from '@apollo/client/core'
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'
import type { ApolloLink } from '@apollo/client/link'
import { ErrorLink } from '@apollo/client/link/error'

import {
  clearAccessToken,
  getAccessToken,
  notifyAuthSessionExpired,
  setAccessToken,
} from '@/shared/lib/auth'

import { getOrCreateRefreshPromise, isRefreshEligible, markRetried } from './authRefreshQueue'

const authErrorCodes = new Set(['UNAUTHENTICATED', 'FORBIDDEN'])
const refreshableAuthErrorCodes = new Set(['UNAUTHENTICATED'])

const invalidateAuthSession = (): void => {
  clearAccessToken()
  notifyAuthSessionExpired()
}

const hasAuthGraphQLError = (error: unknown): boolean => {
  if (!CombinedGraphQLErrors.is(error)) {
    return false
  }

  return error.errors.some(({ extensions }) => {
    const code = extensions?.code

    return typeof code === 'string' && authErrorCodes.has(code)
  })
}

const hasRefreshableGraphQLError = (error: unknown): boolean => {
  if (!CombinedGraphQLErrors.is(error)) {
    return false
  }

  return error.errors.some(({ extensions }) => {
    const code = extensions?.code

    return typeof code === 'string' && refreshableAuthErrorCodes.has(code)
  })
}

const hasAuthNetworkError = (error: unknown): boolean => {
  return ServerError.is(error) && (error.statusCode === 401 || error.statusCode === 403)
}

const hasRefreshableNetworkError = (error: unknown): boolean => {
  return ServerError.is(error) && error.statusCode === 401
}

const hasAuthError = (error: unknown): boolean => {
  return hasAuthGraphQLError(error) || hasAuthNetworkError(error)
}

const hasRefreshableAuthError = (error: unknown): boolean => {
  return hasRefreshableGraphQLError(error) || hasRefreshableNetworkError(error)
}

export const errorLink = new ErrorLink(({ error, forward, operation }) => {
  if (!hasAuthError(error)) {
    return
  }

  const accessToken = getAccessToken()

  if (hasRefreshableAuthError(error) && isRefreshEligible(operation, Boolean(accessToken))) {
    return new Observable<ApolloLink.Result>((observer) => {
      let retrySubscription: { unsubscribe: () => void } | null = null
      let isActive = true

      void getOrCreateRefreshPromise().then((refreshResult) => {
        if (!isActive) {
          return
        }

        if (refreshResult) {
          const didStoreToken = setAccessToken(refreshResult.token, refreshResult.version)

          if (!didStoreToken) {
            observer.error(error)

            return
          }

          markRetried(operation)
          retrySubscription = forward(operation).subscribe(observer)

          return
        }

        invalidateAuthSession()
        retrySubscription = forward(operation).subscribe(observer)
      })

      return () => {
        isActive = false
        retrySubscription?.unsubscribe()
      }
    })
  }

  invalidateAuthSession()
})
