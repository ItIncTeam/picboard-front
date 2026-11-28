import type { PostAuthor } from '../model/backendTypes'

export function getPostAuthorDisplayName(
  author: PostAuthor | null | undefined,
  fallback: string,
): string {
  if (!author) {
    return fallback
  }

  return author.displayName?.trim() || author.username.trim() || fallback
}
