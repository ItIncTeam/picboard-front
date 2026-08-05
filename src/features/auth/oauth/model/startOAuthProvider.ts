import type { OAuthProvider } from './types'

function getOAuthBaseUrl(): string {
  const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL

  if (!oauthBaseUrl) {
    throw new Error('NEXT_PUBLIC_OAUTH_BASE_URL is not configured')
  }

  return oauthBaseUrl
}

const oauthBaseUrl = getOAuthBaseUrl()

function createOAuthStartUrl(path: string): string {
  const endpoint = oauthBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${endpoint}${normalizedPath}`
}

export const oauthStartUrls = {
  github: createOAuthStartUrl('/auth/github/login'),
  google: createOAuthStartUrl('/auth/google/start'),
} as const satisfies Record<OAuthProvider, string>

export const startOAuthProvider = (provider: OAuthProvider): void => {
  window.location.assign(oauthStartUrls[provider])
}
