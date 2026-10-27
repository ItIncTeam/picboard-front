import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const meQuery = gql`
  query Me {
    me {
      id
      email
      username
      isConfirmed
      firstName
      lastName
      displayName
      dateOfBirth
      aboutMe
      profilePictureFileId
      avatar {
        id
        url
      }
      countryId
      cityId
      country {
        id
        code
        name
        nameRu
      }
      city {
        id
        name
        nameRu
      }
    }
  }
`

const refreshTokenMutation = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
    }
  }
`

const logoutMutation = gql`
  mutation Logout {
    logout
  }
`

export type Country = {
  code: string | null
  id: string | null
  name: string | null
  nameRu: string | null
}

export type City = {
  id: string | null
  name: string | null
  nameRu: string | null
}

export type CurrentUser = {
  aboutMe: string | null
  avatar: {
    id: string
    url: string
  } | null
  city: City | null
  cityId: string | null
  country: Country | null
  countryId: string | null
  dateOfBirth: string | null
  displayName: string | null
  email: string
  firstName: string | null
  id: string
  isConfirmed: boolean
  lastName: string | null
  profilePictureFileId: string | null
  username: string
}

export type RefreshTokenPayload = {
  accessToken: string
}

type MeResponse = {
  me: CurrentUser | null
}

type RefreshTokenResponse = {
  refreshToken: RefreshTokenPayload
}

type LogoutResponse = {
  logout: string
}

export const getMe = async (): Promise<CurrentUser> => {
  const response = await apolloClient.query<MeResponse>({
    fetchPolicy: 'network-only',
    query: meQuery,
  })

  const user = response.data?.me

  if (!user) {
    throw new Error('Failed to load current user.')
  }

  return user
}

export const refreshToken = async (): Promise<RefreshTokenPayload> => {
  const response = await apolloClient.mutate<RefreshTokenResponse>({
    mutation: refreshTokenMutation,
  })

  const payload = response.data?.refreshToken

  if (!payload) {
    throw new Error('Failed to refresh session.')
  }

  return payload
}

export const logout = async (): Promise<string> => {
  const response = await apolloClient.mutate<LogoutResponse>({
    mutation: logoutMutation,
  })

  const payload = response.data?.logout

  if (!payload) {
    throw new Error('Logout failed. Please try again.')
  }

  return payload
}
