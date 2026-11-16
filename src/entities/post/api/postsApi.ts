import { gql } from '@apollo/client'
import { CombinedGraphQLErrors } from '@apollo/client/errors'

import { apolloClient } from '@/shared/api'

import type { PostConnection, PostEntity } from '@/entities/post'
import {
  isFeedAuthorErrorPath,
  isPostAuthorErrorPath,
  isProfilePostsAuthorErrorPath,
} from '../lib/graphqlAuthorErrors'
import { postFieldsFragment } from './postFragments'
import { postQuery } from './postQuery'
import { PROFILE_POSTS_PAGE_SIZE } from './profilePostsConstants'

export { postQuery } from './postQuery'
export { PROFILE_POSTS_PAGE_SIZE } from './profilePostsConstants'

export const feedQuery = gql`
  ${postFieldsFragment}

  query Feed {
    usersCount
    feed {
      ...PostFields
    }
  }
`

export const profilePostsQuery = gql`
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

export type FeedQueryData = {
  feed: PostEntity[]
  usersCount: number
}

type PostResponse = {
  post: PostEntity | null
}

export type ProfilePostsQueryData = {
  profilePosts: PostConnection
}

export type ProfilePostsQueryVariables = {
  input: ProfilePostsInput
}

type UpdatePostDescriptionResponse = {
  updatePostDescription: PostEntity
}

type DeletePostResponse = {
  deletePost: boolean
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

function assertProfilePostsFirst(first: number | undefined): void {
  if (first === undefined) {
    return
  }

  if (!Number.isInteger(first) || first < 1 || first > PROFILE_POSTS_PAGE_SIZE) {
    throw new Error(`profilePosts.first must be an integer from 1 to ${PROFILE_POSTS_PAGE_SIZE}.`)
  }
}

function assertAllowedAuthorErrors(
  error: unknown,
  isAllowedPath: (path: ReadonlyArray<string | number> | undefined) => boolean,
): void {
  if (!error) {
    return
  }

  if (!CombinedGraphQLErrors.is(error)) {
    throw error
  }

  for (const graphQLError of error.errors) {
    if (!isAllowedPath(graphQLError.path)) {
      throw error
    }
  }
}

export const feed = async (): Promise<PostEntity[]> => {
  const response = await apolloClient.query<FeedQueryData>({
    errorPolicy: 'all',
    query: feedQuery,
  })

  const payload = response.data?.feed

  if (!payload) {
    throw new Error('Feed loading failed. Please try again.')
  }

  assertAllowedAuthorErrors(response.error, (path) => isFeedAuthorErrorPath(path, payload.length))

  return payload
}

export const post = async (id: string): Promise<PostEntity | null> => {
  const response = await apolloClient.query<PostResponse, { id: string }>({
    errorPolicy: 'all',
    query: postQuery,
    variables: {
      id,
    },
  })

  if (!response.data || !('post' in response.data)) {
    throw new Error('Post loading failed. Please try again.')
  }

  if (response.data.post === null) {
    if (response.error) {
      throw response.error
    }

    return null
  }

  assertAllowedAuthorErrors(response.error, isPostAuthorErrorPath)

  return response.data.post
}

export const profilePosts = async (input: ProfilePostsInput): Promise<PostConnection> => {
  assertProfilePostsFirst(input.first)

  const response = await apolloClient.query<ProfilePostsQueryData, ProfilePostsQueryVariables>({
    errorPolicy: 'all',
    query: profilePostsQuery,
    variables: {
      input,
    },
  })

  const payload = response.data?.profilePosts

  if (!payload) {
    throw new Error('Profile posts loading failed. Please try again.')
  }

  assertAllowedAuthorErrors(response.error, (path) =>
    isProfilePostsAuthorErrorPath(path, payload.edges.length),
  )

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
