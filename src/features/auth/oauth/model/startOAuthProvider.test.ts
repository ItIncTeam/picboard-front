import { afterEach, describe, expect, it, vi } from 'vitest'

async function importOAuthStartUrls() {
  return import('./startOAuthProvider').then((module) => module.oauthStartUrls)
}

async function importStartOAuthProvider() {
  return import('./startOAuthProvider').then((module) => module.startOAuthProvider)
}

describe('oauthStartUrls', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('uses the configured GraphQL endpoint for OAuth start URLs', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'http://localhost:3000/api/v1')

    const oauthStartUrls = await importOAuthStartUrls()

    expect(oauthStartUrls.google).toBe('http://localhost:3000/api/v1/auth/google/start')
    expect(oauthStartUrls.github).toBe('http://localhost:3000/api/v1/auth/github/login')
  })

  it('normalizes the configured GraphQL endpoint trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'https://dev-gateway.picboard.space/api/v1/')

    const oauthStartUrls = await importOAuthStartUrls()

    expect(oauthStartUrls.google).toBe(
      'https://dev-gateway.picboard.space/api/v1/auth/google/start',
    )
    expect(oauthStartUrls.github).toBe(
      'https://dev-gateway.picboard.space/api/v1/auth/github/login',
    )
  })
})

describe('startOAuthProvider', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('redirects the browser to the selected OAuth provider start URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'http://localhost:3000/api/v1')

    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    startOAuthProvider('google')

    expect(assignMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/auth/google/start')
  })
})
