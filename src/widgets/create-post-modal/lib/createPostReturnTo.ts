export const createPostFallbackPath = '/main'

export const getSafeCreatePostReturnTo = (returnTo: string | null): string => {
  if (!returnTo) {
    return createPostFallbackPath
  }

  if (
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.startsWith('/auth') ||
    returnTo === '/posts/create' ||
    returnTo.startsWith('/posts/create?')
  ) {
    return createPostFallbackPath
  }

  return returnTo
}
