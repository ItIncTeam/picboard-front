import { gql } from '@apollo/client'
import { print } from 'graphql'

import type { PostEntity } from '../model/backendTypes'
import { postFieldsFragment } from './postFragments'

export type PublicHomeQueryData = {
  feed: PostEntity[]
  usersCount: number
}

type GraphqlResponse<TData> = {
  data?: TData
  errors?: Array<{ message?: string }>
}

export const publicHomeQuery = gql`
  ${postFieldsFragment}

  query PublicHome {
    usersCount
    feed {
      ...PostFields
    }
  }
`

const PUBLIC_HOME_ERROR_MESSAGE = 'Public Home data is temporarily unavailable.'

function logTransportFailure(endpoint: string, error: unknown): void {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error

  console.error('[PublicHome] request failed', {
    code: cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined,
    endpoint,
    kind: 'transport',
    message: cause instanceof Error ? cause.message : String(cause),
    name: cause instanceof Error ? cause.name : 'UnknownError',
  })
}

export async function getPublicHomeQueryData(): Promise<PublicHomeQueryData> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT

  if (!endpoint || endpoint.startsWith('/')) {
    console.error('[PublicHome] request failed', {
      endpoint: endpoint || '(not configured)',
      kind: 'transport',
      message: 'Absolute GraphQL endpoint is not configured.',
      name: 'ConfigurationError',
    })
    throw new Error(PUBLIC_HOME_ERROR_MESSAGE)
  }

  let response: Response

  try {
    response = await fetch(endpoint, {
      body: JSON.stringify({ query: print(publicHomeQuery) }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
  } catch (error) {
    logTransportFailure(endpoint, error)
    throw new Error(PUBLIC_HOME_ERROR_MESSAGE)
  }

  if (!response.ok) {
    console.error('[PublicHome] request failed', {
      endpoint,
      kind: 'http',
      status: response.status,
      statusText: response.statusText,
    })
    throw new Error(PUBLIC_HOME_ERROR_MESSAGE)
  }

  let payload: GraphqlResponse<PublicHomeQueryData>

  try {
    payload = (await response.json()) as GraphqlResponse<PublicHomeQueryData>
  } catch (error) {
    logTransportFailure(endpoint, error)
    throw new Error(PUBLIC_HOME_ERROR_MESSAGE)
  }

  const data = payload.data

  if (
    payload.errors?.length ||
    !data ||
    !Array.isArray(data.feed) ||
    typeof data.usersCount !== 'number'
  ) {
    console.error('[PublicHome] request failed', {
      endpoint,
      errorCount: payload.errors?.length ?? 0,
      errors: payload.errors?.map(({ message }) => message ?? 'Unknown GraphQL error') ?? [],
      kind: 'graphql',
    })
    throw new Error(PUBLIC_HOME_ERROR_MESSAGE)
  }

  return data
}
