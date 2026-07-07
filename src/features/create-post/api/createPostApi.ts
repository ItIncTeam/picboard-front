import { gql } from '@apollo/client'

import type {
  File as PostFile,
  PostAttachmentEntity,
  PostEntity,
} from '@/entities/post/model/backendTypes'
import { apolloClient } from '@/shared/api'

const createPostMutation = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      ownerId
      description
      attachments {
        fileId
        sortOrder
        file {
          id
          ownerId
          originalName
          purpose
          mimeType
          size
          status
          url
        }
      }
      createdAt
      updatedAt
    }
  }
`

export type CreatePostInput = {
  description?: string
  fileIds: string[]
}

export type { PostAttachmentEntity, PostEntity, PostFile }

type CreatePostResponse = {
  createPost: PostEntity
}

export const createPost = async (input: CreatePostInput): Promise<PostEntity> => {
  const response = await apolloClient.mutate<CreatePostResponse, { input: CreatePostInput }>({
    mutation: createPostMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.createPost

  if (!payload) {
    throw new Error('Post creation failed. Please try again.')
  }

  return payload
}
