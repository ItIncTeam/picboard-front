import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

import type { FileStatus, UploadMimeType, UploadPurpose } from './createPostUploadApi'

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

export type PostFile = {
  id: string
  mimeType: UploadMimeType
  originalName: string
  ownerId: string
  purpose: UploadPurpose
  size: number
  status: FileStatus
  url: string
}

export type PostAttachmentEntity = {
  file: PostFile
  fileId: string
  sortOrder: number
}

export type PostEntity = {
  attachments: PostAttachmentEntity[]
  createdAt: string
  description: string | null
  id: string
  ownerId: string
  updatedAt: string
}

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
