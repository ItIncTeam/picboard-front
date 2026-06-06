import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const graphqlEndpoint = 'https://api.example.test/graphql'

const fetchMock = vi.fn<typeof fetch>()

const jsonResponse = (body: unknown, init?: ResponseInit): Response => {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    ...init,
  })
}

const importRefreshAccessToken = async () => {
  const authRefreshRequestModule = await import('../authRefreshRequest')

  return authRefreshRequestModule.refreshAccessToken
}

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns accessToken on successful refresh', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          refreshToken: {
            accessToken: 'new-access-token',
          },
        },
      }),
    )

    const refreshAccessToken = await importRefreshAccessToken()

    await expect(refreshAccessToken()).resolves.toBe('new-access-token')
  })

  it('returns null on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const refreshAccessToken = await importRefreshAccessToken()

    await expect(refreshAccessToken()).resolves.toBeNull()
  })

  it('returns null on GraphQL errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: null,
        errors: [{ message: 'Unauthorized' }],
      }),
    )

    const refreshAccessToken = await importRefreshAccessToken()

    await expect(refreshAccessToken()).resolves.toBeNull()
  })

  it('returns null when refreshToken data is missing', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          refreshToken: null,
        },
      }),
    )

    const refreshAccessToken = await importRefreshAccessToken()

    await expect(refreshAccessToken()).resolves.toBeNull()
  })

  it('uses the configured endpoint and sends refresh request with credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          refreshToken: {
            accessToken: 'new-access-token',
          },
        },
      }),
    )

    const refreshAccessToken = await importRefreshAccessToken()

    await refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, requestInit] = fetchMock.mock.calls[0] ?? []

    expect(url).toBe(graphqlEndpoint)
    expect(requestInit?.credentials).toBe('include')
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.headers).toEqual({
      'Content-Type': 'application/json',
    })

    const body = JSON.parse(String(requestInit?.body)) as { query?: string }

    expect(body.query).toContain('mutation RefreshToken')
    expect(body.query).toContain('refreshToken')
    expect(body.query).toContain('accessToken')
  })
})
