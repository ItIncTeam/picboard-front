let accessToken: string | null = null

export const getAccessToken = (): string | null => {
  return accessToken
}

export const setAccessToken = (nextAccessToken: string): void => {
  accessToken = nextAccessToken
}

export const clearAccessToken = (): void => {
  accessToken = null
}
