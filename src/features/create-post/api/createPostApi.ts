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
        id
        fileId
        order
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
  description?: string | null
  fileIds: string[]
}

export type { PostAttachmentEntity, PostEntity, PostFile }

type CreatePostResponse = {
  createPost: PostEntity
}

const POST_DESCRIPTION_MAX_LENGTH = 500

function assertDescriptionLength(description: string | null | undefined): void {
  if (
    description !== undefined &&
    description !== null &&
    description.length > POST_DESCRIPTION_MAX_LENGTH
  ) {
    throw new Error(`Post description must be ${POST_DESCRIPTION_MAX_LENGTH} characters or fewer.`)
  }
}

export const createPost = async (input: CreatePostInput): Promise<PostEntity> => {
  assertDescriptionLength(input.description)

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
