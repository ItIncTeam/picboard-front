import { authRoutes } from './authRoutes'

export const defaultReturnToPath = '/main'

export const getSafeReturnToPath = (
  returnTo: string | null,
  fallback: string = defaultReturnToPath,
): string => {
  if (!returnTo) {
    return fallback
  }

  if (
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.startsWith('/auth') ||
    returnTo.includes('\\')
  ) {
    return fallback
  }

  return returnTo
}

export const getSignInHrefWithReturnTo = (returnTo: string): string => {
  const params = new URLSearchParams({
    returnTo: getSafeReturnToPath(returnTo),
  })

  return `${authRoutes.signIn}?${params.toString()}`
}
