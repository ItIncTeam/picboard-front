import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'
import { ErrorLink } from '@apollo/client/link/error'

import { clearAccessToken } from '@/shared/lib/auth'

const authErrorCodes = new Set(['UNAUTHENTICATED', 'FORBIDDEN'])

const hasAuthGraphQLError = (error: unknown): boolean => {
  if (!CombinedGraphQLErrors.is(error)) {
    return false
  }

  return error.errors.some(({ extensions }) => {
    const code = extensions?.code

    return typeof code === 'string' && authErrorCodes.has(code)
  })
}

const hasAuthNetworkError = (error: unknown): boolean => {
  return ServerError.is(error) && (error.statusCode === 401 || error.statusCode === 403)
}

export const errorLink = new ErrorLink(({ error }) => {
  if (hasAuthGraphQLError(error) || hasAuthNetworkError(error)) {
    clearAccessToken()
  }
})
