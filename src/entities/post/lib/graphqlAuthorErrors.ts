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

export function isPostAuthorErrorPath(path: readonly GraphqlPathSegment[] | undefined): boolean {
  if (!path || path.length < 2) {
    return false
  }

  const [root, author, ...fields] = path

  return root === 'post' && author === 'author' && isAuthorFieldPath(fields)
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
