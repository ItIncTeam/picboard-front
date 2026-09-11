import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const exchangeOAuthCodeMutation = gql`
  mutation ExchangeOAuthCode($input: OAuthExchangeCodeInput!) {
    exchangeOAuthCode(input: $input) {
      accessToken
      user {
        id
        email
        username
        isConfirmed
      }
    }
  }
`

export type OAuthExchangeCodeInput = {
  code: string
}

export type OAuthUser = {
  email: string
  id: string
  isConfirmed: boolean
  username: string
}

export type OAuthSignInPayload = {
  accessToken: string
  user: OAuthUser
}

type ExchangeOAuthCodeResponse = {
  exchangeOAuthCode: OAuthSignInPayload
}

export const exchangeOAuthCode = async (
  input: OAuthExchangeCodeInput,
): Promise<OAuthSignInPayload> => {
  const response = await apolloClient.mutate<
    ExchangeOAuthCodeResponse,
    { input: OAuthExchangeCodeInput }
  >({
    mutation: exchangeOAuthCodeMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.exchangeOAuthCode

  if (!payload) {
    throw new Error('OAuth sign in failed. Please try again.')
  }

  return payload
}
