import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const signInMutation = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
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

export type SignInInput = {
  email: string
  password: string
}

export type SignInUser = {
  email: string
  id: string
  isConfirmed: boolean
  username: string
}

export type SignInPayload = {
  accessToken: string
  user: SignInUser
}

type SignInResponse = {
  signIn: SignInPayload
}

export const signIn = async (input: SignInInput): Promise<SignInPayload> => {
  const response = await apolloClient.mutate<SignInResponse, { input: SignInInput }>({
    mutation: signInMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.signIn

  if (!payload) {
    throw new Error('Sign in failed. Please try again.')
  }

  return payload
}
