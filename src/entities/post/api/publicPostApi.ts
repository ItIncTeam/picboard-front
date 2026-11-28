import { print } from 'graphql'

import { isConsistentPostAuthorError } from '../lib/graphqlAuthorErrors'
import { isPostEntity } from '../lib/isPostEntity'
import type { PostEntity } from '../model/backendTypes'
import { postQuery } from './postQuery'

type GraphqlResponse<TData> = {
  data?: TData
  errors?: Array<{ message?: string; path?: Array<string | number> }>
}

type PostQueryData = {
  post: PostEntity | null
}

const PUBLIC_POST_ERROR_MESSAGE = 'Post data is temporarily unavailable.'

function logTransportFailure(endpoint: string, error: unknown): void {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error

  console.error('[PublicPost] request failed', {
    code: cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined,
    endpoint,
    kind: 'transport',
    message: cause instanceof Error ? cause.message : String(cause),
    name: cause instanceof Error ? cause.name : 'UnknownError',
  })
}

function throwGraphqlFailure(
  endpoint: string,
  errors: GraphqlResponse<PostQueryData>['errors'],
  message?: string,
): never {
  console.error('[PublicPost] request failed', {
    endpoint,
    errorCount: errors?.length ?? 0,
    errors: errors?.map(({ message: item }) => item ?? 'Unknown GraphQL error') ?? [],
    kind: 'graphql',
    ...(message ? { message } : {}),
  })
  throw new Error(PUBLIC_POST_ERROR_MESSAGE)
}

export async function getPostQueryData(id: string): Promise<PostEntity | null> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT

  if (!endpoint || endpoint.startsWith('/')) {
    console.error('[PublicPost] request failed', {
      endpoint: endpoint || '(not configured)',
      kind: 'transport',
      message: 'Absolute GraphQL endpoint is not configured.',
      name: 'ConfigurationError',
    })
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  let response: Response

  try {
    response = await fetch(endpoint, {
      body: JSON.stringify({
        query: print(postQuery),
        variables: { id },
      }),
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
  } catch (error) {
    logTransportFailure(endpoint, error)
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  if (!response.ok) {
    console.error('[PublicPost] request failed', {
      endpoint,
      kind: 'http',
      status: response.status,
      statusText: response.statusText,
    })
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  let payload: GraphqlResponse<PostQueryData>

  try {
    payload = (await response.json()) as GraphqlResponse<PostQueryData>
  } catch (error) {
    logTransportFailure(endpoint, error)
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  const data = payload.data

  if (!data || !('post' in data)) {
    throwGraphqlFailure(endpoint, payload.errors)
  }

  if (data.post === null) {
    if (payload.errors?.length) {
      throwGraphqlFailure(endpoint, payload.errors)
    }

    return null
  }

  if (!isPostEntity(data.post)) {
    throwGraphqlFailure(endpoint, payload.errors, 'Post payload is incomplete.')
  }

  for (const error of payload.errors ?? []) {
    if (!isConsistentPostAuthorError(error.path, data.post)) {
      throwGraphqlFailure(endpoint, payload.errors)
    }
  }

  return data.post
}
