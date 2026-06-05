import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const emailConfirmationMutation = gql`
  mutation EmailConfirmation($input: EmailConfirmationInput!) {
    emailConfirmation(input: $input) {
      message
    }
  }
`

const emailConfirmationResendingMutation = gql`
  mutation EmailConfirmationResending($input: ResendEmailInput!) {
    emailConfirmationResending(input: $input) {
      message
    }
  }
`

export type EmailConfirmationInput = {
  code: string
}

export type EmailConfirmationPayload = {
  message: string
}

export type EmailConfirmationResendingInput = {
  email: string
}

export type EmailConfirmationResendingPayload = {
  message: string
}

type EmailConfirmationResponse = {
  emailConfirmation: EmailConfirmationPayload
}

type EmailConfirmationResendingResponse = {
  emailConfirmationResending: EmailConfirmationResendingPayload
}

export const emailConfirmation = async (
  input: EmailConfirmationInput,
): Promise<EmailConfirmationPayload> => {
  const response = await apolloClient.mutate<
    EmailConfirmationResponse,
    { input: EmailConfirmationInput }
  >({
    mutation: emailConfirmationMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.emailConfirmation

  if (!payload) {
    throw new Error('Email confirmation failed. Please try again.')
  }

  return payload
}

export const emailConfirmationResending = async (
  input: EmailConfirmationResendingInput,
): Promise<EmailConfirmationResendingPayload> => {
  const response = await apolloClient.mutate<
    EmailConfirmationResendingResponse,
    { input: EmailConfirmationResendingInput }
  >({
    mutation: emailConfirmationResendingMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.emailConfirmationResending

  if (!payload) {
    throw new Error('Email confirmation resending failed. Please try again.')
  }

  return payload
}
