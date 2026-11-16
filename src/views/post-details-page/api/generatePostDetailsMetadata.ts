import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPostAuthorDisplayName } from '@/entities/post'

import { getCachedInitialPost } from './loadInitialPost'

const METADATA_DESCRIPTION_MAX_LENGTH = 160
const METADATA_AUTHOR_FALLBACK = 'Post'

export async function generatePostDetailsMetadata(postId: string): Promise<Metadata> {
  const data = await getCachedInitialPost(postId)

  if (!data) {
    notFound()
  }

  const authorName = getPostAuthorDisplayName(data.post.author, METADATA_AUTHOR_FALLBACK)
  const description =
    data.post.description?.trim() ||
    (data.post.author ? `Post by ${authorName}` : METADATA_AUTHOR_FALLBACK)

  return {
    description: description.slice(0, METADATA_DESCRIPTION_MAX_LENGTH),
    title: authorName,
  }
}
