import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const userQuery = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      username
      displayName
      bio
      profilePictureFileId
      avatar {
        id
        url
      }
    }
  }
`

export type PublicUserAvatar = {
  id: string
  url: string
}

export type PublicUser = {
  avatar: PublicUserAvatar | null
  bio: string | null
  displayName: string | null
  id: string
  profilePictureFileId: string | null
  username: string
}

type UserResponse = {
  user: PublicUser | null
}

export async function getUser(id: string): Promise<PublicUser | null> {
  const response = await apolloClient.query<UserResponse, { id: string }>({
    query: userQuery,
    variables: { id },
  })

  if (!response.data || !('user' in response.data)) {
    throw new Error('Profile loading failed. Please try again.')
  }

  return response.data.user
}
