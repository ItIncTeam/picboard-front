import type {
  File as PostFile,
  PostAttachmentEntity,
  PostAuthor,
  PostConnection,
  PostEntity,
} from '../model/backendTypes'

const FILE_PURPOSES = ['POST_IMAGE', 'BILL'] as const
const MIME_TYPES = ['JPEG', 'PNG'] as const
const FILE_STATUSES = ['PENDING', 'UPLOADED', 'READY', 'FAILED', 'DELETED'] as const

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

function isPostAvatar(value: unknown): value is PostAuthor['avatar'] {
  if (value === null) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string' && typeof value.url === 'string'
}

function isPostAuthor(value: unknown): value is PostAuthor {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    (value.displayName === null || typeof value.displayName === 'string') &&
    (value.profilePictureFileId === null || typeof value.profilePictureFileId === 'string') &&
    isPostAvatar(value.avatar)
  )
}

export function isPostEntity(value: unknown): value is PostEntity {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.ownerId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.description === null || typeof value.description === 'string') &&
    (value.author === null || isPostAuthor(value.author)) &&
    Array.isArray(value.attachments) &&
    value.attachments.every(isPostAttachment)
  )
}

export function isPostConnection(value: unknown): value is PostConnection {
  if (!isRecord(value) || !Array.isArray(value.edges) || !isRecord(value.pageInfo)) {
    return false
  }

  const { pageInfo } = value

  return (
    typeof pageInfo.hasNextPage === 'boolean' &&
    (pageInfo.endCursor === null || typeof pageInfo.endCursor === 'string') &&
    (pageInfo.startCursor === null || typeof pageInfo.startCursor === 'string') &&
    value.edges.every(
      (edge) => isRecord(edge) && typeof edge.cursor === 'string' && isPostEntity(edge.node),
    )
  )
}
