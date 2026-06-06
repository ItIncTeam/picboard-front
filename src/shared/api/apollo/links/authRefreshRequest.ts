import { graphqlEndpoint } from './httpLink'

const refreshTokenMutation = `
  mutation RefreshToken {
    refreshToken {
      accessToken
    }
  }
`

type RefreshAccessTokenResponse = {
  data?: {
    refreshToken?: {
      accessToken?: unknown
    } | null
  } | null
  errors?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const parseRefreshAccessTokenResponse = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null
  }

  const response = value as RefreshAccessTokenResponse

  if (Array.isArray(response.errors) && response.errors.length > 0) {
    return null
  }

  const accessToken = response.data?.refreshToken?.accessToken

  return typeof accessToken === 'string' && accessToken.length > 0 ? accessToken : null
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(graphqlEndpoint, {
      body: JSON.stringify({
        query: refreshTokenMutation,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as unknown

    return parseRefreshAccessTokenResponse(json)
  } catch {
    return null
  }
}
