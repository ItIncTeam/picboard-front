'use client'

import { useApolloClient } from '@apollo/client/react'
import { useEffect } from 'react'

import { postQuery } from '@/entities/post/api/postQuery'
import type { PostEntity } from '@/entities/post/model/backendTypes'

type UseSeedPostDetailsCacheInput = {
  baselineKey: string
  post: PostEntity
}

function toSeededPost(post: PostEntity) {
  return {
    ...post,
    __typename: 'PostEntity' as const,
    attachments: post.attachments.map((attachment) => ({
      ...attachment,
      __typename: 'PostAttachmentEntity' as const,
      file: attachment.file
        ? {
            ...attachment.file,
            __typename: 'File' as const,
          }
        : null,
    })),
    author: {
      ...post.author,
      __typename: 'User' as const,
      avatar: post.author.avatar
        ? {
            ...post.author.avatar,
            __typename: 'File' as const,
          }
        : null,
    },
  }
}

export function useSeedPostDetailsCache({ baselineKey, post }: UseSeedPostDetailsCacheInput): void {
  const client = useApolloClient()

  useEffect(() => {
    client.writeQuery({
      data: {
        post: toSeededPost(post),
      },
      query: postQuery,
      variables: {
        id: post.id,
      },
    })
  }, [baselineKey, client, post])
}
