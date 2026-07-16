import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

import type { PostConnection, PostEntity } from '@/entities/post'

const postFieldsFragment = gql`
  fragment PostFields on PostEntity {
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
`

const feedQuery = gql`
  ${postFieldsFragment}

  query Feed {
    feed {
      ...PostFields
    }
  }
`

const postQuery = gql`
  ${postFieldsFragment}

  query Post($id: ID!) {
    post(id: $id) {
      ...PostFields
    }
  }
`

const profilePostsQuery = gql`
  ${postFieldsFragment}

  query ProfilePosts($input: ProfilePostsInput!) {
    profilePosts(input: $input) {
      edges {
        cursor
        node {
          ...PostFields
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
    }
  }
`

const updatePostDescriptionMutation = gql`
  ${postFieldsFragment}

  mutation UpdatePostDescription($input: UpdatePostDescriptionInput!) {
    updatePostDescription(input: $input) {
      ...PostFields
    }
  }
`

const deletePostMutation = gql`
  mutation DeletePost($input: DeletePostInput!) {
    deletePost(input: $input)
  }
`

export type ProfilePostsInput = {
  after?: string
  first?: number
  userId: string
}

export type UpdatePostDescriptionInput = {
  description?: string | null
  postId: string
}

export type DeletePostInput = {
  postId: string
}

type FeedResponse = {
  feed: PostEntity[]
}

type PostResponse = {
  post: PostEntity | null
}

type ProfilePostsResponse = {
  profilePosts: PostConnection
}

type UpdatePostDescriptionResponse = {
  updatePostDescription: PostEntity
}

type DeletePostResponse = {
  deletePost: boolean
}

const POST_DESCRIPTION_MAX_LENGTH = 500
const PROFILE_POSTS_FIRST_MAX = 8

function assertDescriptionLength(description: string | null | undefined): void {
  if (
    description !== undefined &&
    description !== null &&
    description.length > POST_DESCRIPTION_MAX_LENGTH
  ) {
    throw new Error(`Post description must be ${POST_DESCRIPTION_MAX_LENGTH} characters or fewer.`)
  }
}

function assertProfilePostsFirst(first: number | undefined): void {
  if (first === undefined) {
    return
  }

  if (!Number.isInteger(first) || first < 1 || first > PROFILE_POSTS_FIRST_MAX) {
    throw new Error(`profilePosts.first must be an integer from 1 to ${PROFILE_POSTS_FIRST_MAX}.`)
  }
}

export const feed = async (): Promise<PostEntity[]> => {
  const response = await apolloClient.query<FeedResponse>({
    query: feedQuery,
  })

  const payload = response.data?.feed

  if (!payload) {
    throw new Error('Feed loading failed. Please try again.')
  }

  return payload
}

export const post = async (id: string): Promise<PostEntity | null> => {
  const response = await apolloClient.query<PostResponse, { id: string }>({
    query: postQuery,
    variables: {
      id,
    },
  })

  if (!response.data || !('post' in response.data)) {
    throw new Error('Post loading failed. Please try again.')
  }

  return response.data.post
}

export const profilePosts = async (input: ProfilePostsInput): Promise<PostConnection> => {
  assertProfilePostsFirst(input.first)

  const response = await apolloClient.query<ProfilePostsResponse, { input: ProfilePostsInput }>({
    query: profilePostsQuery,
    variables: {
      input,
    },
  })

  const payload = response.data?.profilePosts

  if (!payload) {
    throw new Error('Profile posts loading failed. Please try again.')
  }

  return payload
}

export const updatePostDescription = async (
  input: UpdatePostDescriptionInput,
): Promise<PostEntity> => {
  assertDescriptionLength(input.description)

  const response = await apolloClient.mutate<
    UpdatePostDescriptionResponse,
    { input: UpdatePostDescriptionInput }
  >({
    mutation: updatePostDescriptionMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.updatePostDescription

  if (!payload) {
    throw new Error('Post description update failed. Please try again.')
  }

  return payload
}

export const deletePost = async (input: DeletePostInput): Promise<boolean> => {
  const response = await apolloClient.mutate<DeletePostResponse, { input: DeletePostInput }>({
    mutation: deletePostMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.deletePost

  if (payload === undefined || payload === null) {
    throw new Error('Post deletion failed. Please try again.')
  }

  return payload
}
