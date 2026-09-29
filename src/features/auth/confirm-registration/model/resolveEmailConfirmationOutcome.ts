export type EmailConfirmationOutcome =
  | { kind: 'confirmed' }
  | { kind: 'expired' }
  | { kind: 'unknown-error'; message: string }

export const emailConfirmationFallbackErrorMessage = 'Email confirmation failed. Please try again.'

export const getEmailConfirmationErrorMessage = (error: unknown): string => {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : emailConfirmationFallbackErrorMessage
}

export const isAlreadyConfirmedError = (message: string): boolean => {
  return message.toLowerCase().includes('email already confirmed')
}

export const isExpiredConfirmationError = (message: string): boolean => {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('expired') ||
    normalized.includes('invalid confirmation code') ||
    normalized.includes('invalid code')
  )
}

export const resolveEmailConfirmationOutcome = (error: unknown): EmailConfirmationOutcome => {
  const message = getEmailConfirmationErrorMessage(error)

  if (isAlreadyConfirmedError(message)) {
    return { kind: 'confirmed' }
  }

  if (isExpiredConfirmationError(message)) {
    return { kind: 'expired' }
  }

  return {
    kind: 'unknown-error',
    message,
  }
}
