import { print } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPublicHomeQueryData, publicHomeQuery } from './publicHomeApi'

const graphqlEndpoint = 'https://gateway.example.test/api/v1'

describe('Public Home GraphQL boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('uses the gateway-compatible Public Home document', () => {
    const document = print(publicHomeQuery)
    const compactDocument = document.replace(/\s+/g, ' ')

    expect(compactDocument).toContain('query PublicHome { usersCount feed { ...PostFields } }')
    expect(compactDocument).toContain('attachments { fileId sortOrder file {')
    expect(compactDocument).toContain('status url')
    expect(document).not.toMatch(/^\s+order$/m)
    expect(compactDocument).not.toContain('attachments { id')
  })

  it('returns a real zero users count as successful data', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              feed: [],
              usersCount: 0,
            },
          }),
          { status: 200 },
        ),
      ),
    )

    await expect(getPublicHomeQueryData()).resolves.toEqual({
      feed: [],
      usersCount: 0,
    })
  })

  it('rejects gateway errors instead of returning successful empty data', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [{ message: 'Gateway unavailable' }],
          }),
          { status: 200 },
        ),
      ),
    )

    await expect(getPublicHomeQueryData()).rejects.toThrow(
      'Public Home data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicHome] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        errorCount: 1,
        errors: ['Gateway unavailable'],
        kind: 'graphql',
      }),
    )
  })

  it('logs minimal HTTP diagnostics without reading the response body', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const text = vi.fn()
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text,
      } as unknown as Response),
    )

    await expect(getPublicHomeQueryData()).rejects.toThrow(
      'Public Home data is temporarily unavailable.',
    )
    expect(text).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicHome] request failed',
      expect.objectContaining({
        endpoint: graphqlEndpoint,
        kind: 'http',
        status: 502,
        statusText: 'Bad Gateway',
      }),
    )
  })

  it('logs the safe transport cause when server fetch rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const cause = Object.assign(new Error('self-signed certificate'), {
      code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
    })
    vi.stubEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT', graphqlEndpoint)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause })))

    await expect(getPublicHomeQueryData()).rejects.toThrow(
      'Public Home data is temporarily unavailable.',
    )
    expect(consoleError).toHaveBeenCalledWith(
      '[PublicHome] request failed',
      expect.objectContaining({
        code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
        endpoint: graphqlEndpoint,
        kind: 'transport',
        message: 'self-signed certificate',
        name: 'Error',
      }),
    )
  })
})
