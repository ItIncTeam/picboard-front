import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

export { getMe, type CurrentUser, type Country, type City } from '@/entities/user/current-user'

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

export type RefreshTokenPayload = {
  accessToken: string
}

type RefreshTokenResponse = {
  refreshToken: RefreshTokenPayload
}

type LogoutResponse = {
  logout: string
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
