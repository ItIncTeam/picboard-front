let accessToken: string | null = null
let tokenVersion = 0

export const getAccessToken = (): string | null => {
  return accessToken
}

export const getTokenVersion = (): number => {
  return tokenVersion
}

export const incrementTokenVersion = (): void => {
  tokenVersion += 1
}

export const setAccessToken = (nextAccessToken: string, version?: number): boolean => {
  if (typeof version === 'number') {
    if (version !== tokenVersion) {
      return false
    }

    accessToken = nextAccessToken

    return true
  }

  incrementTokenVersion()
  accessToken = nextAccessToken

  return true
}

export const clearAccessToken = (): void => {
  accessToken = null
  incrementTokenVersion()
}
