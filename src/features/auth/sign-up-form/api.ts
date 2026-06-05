import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const signUpMutation = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      message
    }
  }
`

export type SignUpInput = {
  acceptPrivacy: boolean
  acceptTerms: boolean
  email: string
  password: string
  username: string
}

export type SignUpPayload = {
  message: string
}

type SignUpResponse = {
  signUp: SignUpPayload
}

export const signUp = async (input: SignUpInput): Promise<SignUpPayload> => {
  const response = await apolloClient.mutate<SignUpResponse, { input: SignUpInput }>({
    mutation: signUpMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.signUp

  if (!payload) {
    throw new Error('Sign up failed. Please try again.')
  }

  return payload
}
