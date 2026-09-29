import { cache } from 'react'

import { getPostQueryData, type PostEntity } from '@/entities/post'

export type InitialPostData = {
  baselineKey: string
  post: PostEntity
}

export async function loadInitialPost(postId: string): Promise<InitialPostData | null> {
  const post = await getPostQueryData(postId)

  if (post === null) {
    return null
  }

  return {
    baselineKey: crypto.randomUUID(),
    post,
  }
}

export const getCachedInitialPost = cache(loadInitialPost)
