import type { OAuthProvider } from './types'

export const startOAuthProvider = (provider: OAuthProvider): void => {
  const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL

  if (!oauthBaseUrl) {
    throw new Error('NEXT_PUBLIC_OAUTH_BASE_URL is not configured')
  }

  const path = provider === 'google' ? '/auth/google/start' : '/auth/github/login'
  const oauthStartUrl = `${oauthBaseUrl.replace(/\/+$/, '')}${path}`

  window.location.assign(oauthStartUrl)
}
