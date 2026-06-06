import type { ApolloLink } from '@apollo/client/link'

import { getTokenVersion } from '@/shared/lib/auth'

import { refreshAccessToken } from './authRefreshRequest'

const retriedContextKey = 'authRefreshRetried'
const skippedOperationNames = new Set(['SignIn', 'Logout', 'RefreshToken'])

export type AuthRefreshResult = {
  token: string
  version: number
}

let refreshPromise: Promise<AuthRefreshResult | null> | null = null

export function hasAlreadyRetried(operation: ApolloLink.Operation): boolean {
  return operation.getContext()[retriedContextKey] === true
}

export function markRetried(operation: ApolloLink.Operation): void {
  operation.setContext({
    [retriedContextKey]: true,
  })
}

export function isRefreshEligible(
  operation: ApolloLink.Operation,
  hasAccessToken: boolean,
): boolean {
  if (!hasAccessToken || hasAlreadyRetried(operation)) {
    return false
  }

  const operationName = operation.operationName

  return typeof operationName !== 'string' || !skippedOperationNames.has(operationName)
}

export function getOrCreateRefreshPromise(): Promise<AuthRefreshResult | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  const version = getTokenVersion()

  refreshPromise = refreshAccessToken()
    .then((token): AuthRefreshResult | null => {
      return token ? { token, version } : null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export function clearRefreshPromise(): void {
  refreshPromise = null
}
