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
    vi.unstubAllGlobals()
  })

  it('fails fast when the OAuth base URL is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', '')
    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    await expect(importOAuthStartUrls()).rejects.toThrow(
      'NEXT_PUBLIC_OAUTH_BASE_URL is not configured',
    )
    expect(assignMock).not.toHaveBeenCalled()
  })

  it('uses the OAuth base URL independently from the GraphQL endpoint', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'https://gateway.picboard.space/api/v1')
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.picboard.space/api/v1')

    const oauthStartUrls = await importOAuthStartUrls()

    expect(oauthStartUrls.google).toBe('https://users.picboard.space/api/v1/auth/google/start')
    expect(oauthStartUrls.github).toBe('https://users.picboard.space/api/v1/auth/github/login')
  })

  it('normalizes the OAuth base URL trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.picboard.space/api/v1/')

    const oauthStartUrls = await importOAuthStartUrls()

    expect(oauthStartUrls.google).toBe('https://users.picboard.space/api/v1/auth/google/start')
    expect(oauthStartUrls.github).toBe('https://users.picboard.space/api/v1/auth/github/login')
  })
})

describe('startOAuthProvider', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it.each([
    ['google', 'https://users.picboard.space/api/v1/auth/google/start'],
    ['github', 'https://users.picboard.space/api/v1/auth/github/login'],
  ] as const)('redirects the browser to the %s OAuth start URL', async (provider, expectedUrl) => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.picboard.space/api/v1')

    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    startOAuthProvider(provider)

    expect(assignMock).toHaveBeenCalledWith(expectedUrl)
  })
})
