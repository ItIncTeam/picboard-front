import { authRoutes } from './authRoutes'

export const defaultReturnToPath = '/main'

export const getSafeReturnToPath = (returnTo: string | null): string => {
  if (!returnTo) {
    return defaultReturnToPath
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.startsWith('/auth')) {
    return defaultReturnToPath
  }

  return returnTo
}

export const getSignInHrefWithReturnTo = (returnTo: string): string => {
  const params = new URLSearchParams({
    returnTo: getSafeReturnToPath(returnTo),
  })

  return `${authRoutes.signIn}?${params.toString()}`
}
