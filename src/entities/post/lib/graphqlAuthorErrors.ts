import type { PostAuthor, PostConnection, PostEntity } from '../model/backendTypes'

export type GraphqlPathSegment = string | number

const AUTHOR_FIELDS = new Set([
  'id',
  'username',
  'displayName',
  'profilePictureFileId',
  '__typename',
])
const AVATAR_FIELDS = new Set(['id', 'url', '__typename'])

export function isAuthorFieldPath(fields: readonly GraphqlPathSegment[]): boolean {
  return (
    fields.length === 0 ||
    (fields.length === 1 && AUTHOR_FIELDS.has(String(fields[0]))) ||
    (fields[0] === 'avatar' &&
      (fields.length === 1 || (fields.length === 2 && AVATAR_FIELDS.has(String(fields[1])))))
  )
}

export function isAuthorStateConsistentWithErrorFields(
  author: PostAuthor | null,
  fieldsAfterAuthor: readonly GraphqlPathSegment[],
): boolean {
  if (!isAuthorFieldPath(fieldsAfterAuthor)) {
    return false
  }

  if (fieldsAfterAuthor[0] === 'avatar') {
    return author === null || author.avatar === null
  }

  return author === null
}

export function isPostAuthorErrorPath(path: readonly GraphqlPathSegment[] | undefined): boolean {
  if (!path || path.length < 2) {
    return false
  }

  const [root, author, ...fields] = path

  return root === 'post' && author === 'author' && isAuthorFieldPath(fields)
}

export function isConsistentPostAuthorError(
  path: readonly GraphqlPathSegment[] | undefined,
  post: PostEntity,
): boolean {
  if (!isPostAuthorErrorPath(path) || !path) {
    return false
  }

  const [, , ...fields] = path

  return isAuthorStateConsistentWithErrorFields(post.author, fields)
}

export function isFeedAuthorErrorPath(
  path: readonly GraphqlPathSegment[] | undefined,
  feedLength: number,
): boolean {
  if (!path || path.length < 3) {
    return false
  }

  const [root, index, author, ...fields] = path

  return (
    root === 'feed' &&
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < feedLength &&
    author === 'author' &&
    isAuthorFieldPath(fields)
  )
}

export function isConsistentFeedAuthorError(
  path: readonly GraphqlPathSegment[] | undefined,
  feed: readonly PostEntity[],
): boolean {
  if (!isFeedAuthorErrorPath(path, feed.length) || !path) {
    return false
  }

  const [, index, , ...fields] = path
  const post = feed[index as number]

  return Boolean(post) && isAuthorStateConsistentWithErrorFields(post.author, fields)
}

export function isProfilePostsAuthorErrorPath(
  path: readonly GraphqlPathSegment[] | undefined,
  edgesLength: number,
): boolean {
  if (!path || path.length < 5) {
    return false
  }

  const [root, edges, index, node, author, ...fields] = path

  return (
    root === 'profilePosts' &&
    edges === 'edges' &&
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < edgesLength &&
    node === 'node' &&
    author === 'author' &&
    isAuthorFieldPath(fields)
  )
}

export function isConsistentProfilePostsAuthorError(
  path: readonly GraphqlPathSegment[] | undefined,
  connection: PostConnection,
): boolean {
  if (!isProfilePostsAuthorErrorPath(path, connection.edges.length) || !path) {
    return false
  }

  const [, , index, , , ...fields] = path
  const post = connection.edges[index as number]?.node

  return Boolean(post) && isAuthorStateConsistentWithErrorFields(post.author, fields)
}
