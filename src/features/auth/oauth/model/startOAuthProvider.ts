import type { OAuthProvider } from './types'

export const oauthStartUrls = {
  github: 'https://users.picboard.space/api/v1/auth/github/login',
  google: 'https://users.picboard.space/api/v1/auth/google/start',
} as const satisfies Record<OAuthProvider, string>

export const startOAuthProvider = (provider: OAuthProvider): void => {
  window.location.assign(oauthStartUrls[provider])
}
