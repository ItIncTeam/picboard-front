import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCachedInitialPost } from './loadInitialPost'

const METADATA_DESCRIPTION_MAX_LENGTH = 160

function getPostAuthorName(displayName: string | null, username: string): string {
  return displayName?.trim() || username
}

export async function generatePostDetailsMetadata(postId: string): Promise<Metadata> {
  const data = await getCachedInitialPost(postId)

  if (!data) {
    notFound()
  }

  const authorName = getPostAuthorName(data.post.author.displayName, data.post.author.username)
  const description = data.post.description?.trim() || `Post by ${authorName}`

  return {
    description: description.slice(0, METADATA_DESCRIPTION_MAX_LENGTH),
    title: authorName,
  }
}
