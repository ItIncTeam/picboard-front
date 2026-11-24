import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

export const userQuery = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      username
      displayName
      aboutMe
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
  aboutMe: string | null
  displayName: string | null
  id: string
  profilePictureFileId: string | null
  username: string
}

type UserResponse = {
  user: PublicUser | null
}

export async function getUser(
  id: string,
  fetchPolicy: 'cache-first' | 'no-cache' = 'cache-first',
): Promise<PublicUser | null> {
  const response = await apolloClient.query<UserResponse, { id: string }>({
    ...(fetchPolicy === 'no-cache' ? { fetchPolicy } : {}),
    query: userQuery,
    variables: { id },
  })

  if (!response.data || !('user' in response.data)) {
    throw new Error('Profile loading failed. Please try again.')
  }

  return response.data.user
}

export function writePublicUserCache(user: PublicUser): void {
  apolloClient.writeQuery<UserResponse, { id: string }>({
    data: { user },
    query: userQuery,
    variables: { id: user.id },
  })
}
