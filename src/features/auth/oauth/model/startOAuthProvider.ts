import type { OAuthProvider } from './types'

export const startOAuthProvider = (provider: OAuthProvider): void => {
  const backendBaseUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT

  if (!backendBaseUrl) {
    throw new Error('NEXT_PUBLIC_GRAPHQL_ENDPOINT is not configured')
  }

  const path = provider === 'google' ? '/auth/google/start' : '/auth/github/login'
  const oauthStartUrl = `${backendBaseUrl.replace(/\/+$/, '')}${path}`

  window.location.assign(oauthStartUrl)
}
