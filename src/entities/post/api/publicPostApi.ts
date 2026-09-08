import { print } from 'graphql'

import type {
  File as PostFile,
  PostAttachmentEntity,
  PostAuthor,
  PostEntity,
} from '../model/backendTypes'
import { postQuery } from './postQuery'

type GraphqlResponse<TData> = {
  data?: TData
  errors?: Array<{ message?: string }>
}

type PostQueryData = {
  post: PostEntity | null
}

const FILE_PURPOSES = ['POST_IMAGE', 'BILL'] as const
const MIME_TYPES = ['JPEG', 'PNG'] as const
const FILE_STATUSES = ['PENDING', 'UPLOADED', 'READY', 'FAILED', 'DELETED'] as const

const PUBLIC_POST_ERROR_MESSAGE = 'Post data is temporarily unavailable.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isKnownValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.some((item) => item === value)
}

function isPostFile(value: unknown): value is PostFile {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.ownerId === 'string' &&
    typeof value.originalName === 'string' &&
    isKnownValue(value.purpose, FILE_PURPOSES) &&
    isKnownValue(value.mimeType, MIME_TYPES) &&
    typeof value.size === 'number' &&
    Number.isFinite(value.size) &&
    isKnownValue(value.status, FILE_STATUSES) &&
    typeof value.url === 'string'
  )
}

function isPostAttachment(value: unknown): value is PostAttachmentEntity {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.fileId !== 'string' || typeof value.sortOrder !== 'number') {
    return false
  }

  return value.file === null || isPostFile(value.file)
}

function isPostAuthor(value: unknown): value is PostAuthor {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    (value.displayName === null || typeof value.displayName === 'string') &&
    (value.profilePictureFileId === null || typeof value.profilePictureFileId === 'string')
  )
}

function isPostEntity(value: unknown): value is PostEntity {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.ownerId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.description === null || typeof value.description === 'string') &&
    isPostAuthor(value.author) &&
    Array.isArray(value.attachments) &&
    value.attachments.every(isPostAttachment)
  )
}

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

  if (payload.errors?.length || !data || !('post' in data)) {
    console.error('[PublicPost] request failed', {
      endpoint,
      errorCount: payload.errors?.length ?? 0,
      errors: payload.errors?.map(({ message }) => message ?? 'Unknown GraphQL error') ?? [],
      kind: 'graphql',
    })
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  if (data.post === null) {
    return null
  }

  if (!isPostEntity(data.post)) {
    console.error('[PublicPost] request failed', {
      endpoint,
      kind: 'graphql',
      message: 'Post payload is incomplete.',
    })
    throw new Error(PUBLIC_POST_ERROR_MESSAGE)
  }

  return data.post
}
