import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const passwordResetMutation = gql`
  mutation PasswordReset($input: PasswordResetInput!) {
    passwordReset(input: $input) {
      message
    }
  }
`

const setNewPasswordMutation = gql`
  mutation SetNewPassword($input: SetNewPasswordInput!) {
    setNewPassword(input: $input) {
      message
    }
  }
`

export type PasswordResetInput = {
  captchaToken: string
  email: string
}

export type PasswordResetResult = {
  message: string
}

export type SetNewPasswordInput = {
  code: string
  password: string
}

export type SetNewPasswordResult = {
  message: string
}

type PasswordResetResponse = {
  passwordReset: PasswordResetResult
}

type SetNewPasswordResponse = {
  setNewPassword: SetNewPasswordResult
}

export const passwordReset = async (input: PasswordResetInput): Promise<PasswordResetResult> => {
  const response = await apolloClient.mutate<PasswordResetResponse, { input: PasswordResetInput }>({
    mutation: passwordResetMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.passwordReset

  if (!payload) {
    throw new Error('Password reset failed. Please try again.')
  }

  return payload
}

export const setNewPassword = async (input: SetNewPasswordInput): Promise<SetNewPasswordResult> => {
  const response = await apolloClient.mutate<
    SetNewPasswordResponse,
    { input: SetNewPasswordInput }
  >({
    mutation: setNewPasswordMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.setNewPassword

  if (!payload) {
    throw new Error('Password update failed. Please try again.')
  }

  return payload
}
