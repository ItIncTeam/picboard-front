import type { OAuthProvider } from './types'

const graphqlEndpoint =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql')
    : '/graphql'

function createOAuthStartUrl(path: string): string {
  const endpoint = graphqlEndpoint.replace(/\/+$/, '')
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
