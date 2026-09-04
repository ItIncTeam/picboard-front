import { afterEach, describe, expect, it, vi } from 'vitest'

async function importStartOAuthProvider() {
  return import('./startOAuthProvider').then((module) => module.startOAuthProvider)
}

describe('startOAuthProvider', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('imports safely without the OAuth base URL and fails on invocation without navigating', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'https://gateway.example.test/api/v1')
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', '')
    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    expect(() => startOAuthProvider('google')).toThrow(
      'NEXT_PUBLIC_OAUTH_BASE_URL is not configured',
    )
    expect(assignMock).not.toHaveBeenCalled()
  })

  it.each([
    ['google', 'https://users.example.test/api/v1/auth/google/start'],
    ['github', 'https://users.example.test/api/v1/auth/github/login'],
  ] as const)('navigates to the configured %s start URL', async (provider, expectedUrl) => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'https://gateway.example.test/api/v1')
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.example.test/api/v1')
    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    startOAuthProvider(provider)

    expect(assignMock).toHaveBeenCalledOnce()
    expect(assignMock).toHaveBeenCalledWith(expectedUrl)
  })

  it('normalizes trailing slashes', async () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.example.test/api/v1///')
    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    startOAuthProvider('github')

    expect(assignMock).toHaveBeenCalledWith('https://users.example.test/api/v1/auth/github/login')
  })

  it('does not use the GraphQL endpoint for OAuth navigation', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', 'https://gateway.example.test/api/v1')
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', 'https://users.example.test/api/v1')
    const assignMock = vi.fn()

    vi.stubGlobal('window', {
      location: {
        assign: assignMock,
      },
    })

    const startOAuthProvider = await importStartOAuthProvider()

    startOAuthProvider('google')

    expect(assignMock).toHaveBeenCalledWith('https://users.example.test/api/v1/auth/google/start')
  })
})
