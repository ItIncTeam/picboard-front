import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const PASSWORD_RESET_SCORE_THRESHOLD = 0.5

const passwordResetMutation = gql`
  mutation PasswordReset($input: PasswordResetInput!) {
    passwordReset(input: $input) {
      success
      score
      message
    }
  }
`

export type PasswordResetParams = {
  captchaToken: string
  email: string
}

type PasswordResetResponse = {
  passwordReset: {
    message: string
    score: number
    success: boolean
  }
}

export const passwordReset = async ({
  captchaToken,
  email,
}: PasswordResetParams): Promise<void> => {
  const response = await apolloClient.mutate<PasswordResetResponse, { input: PasswordResetParams }>(
    {
      mutation: passwordResetMutation,
      variables: {
        input: {
          captchaToken,
          email,
        },
      },
    },
  )

  const payload = response.data?.passwordReset

  if (!payload) {
    throw new Error('Password reset failed. Please try again.')
  }

  if (!payload.success) {
    throw new Error(payload.message || 'Password reset failed. Please try again.')
  }

  if (payload.score < PASSWORD_RESET_SCORE_THRESHOLD) {
    throw new Error('reCAPTCHA verification failed. Please try again.')
  }
}
