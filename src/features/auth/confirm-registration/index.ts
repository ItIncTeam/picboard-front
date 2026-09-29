export {
  emailConfirmation,
  emailConfirmationResending,
  type EmailConfirmationInput,
  type EmailConfirmationPayload,
  type EmailConfirmationResendingInput,
  type EmailConfirmationResendingPayload,
} from './api'
export {
  emailConfirmationFallbackErrorMessage,
  getEmailConfirmationErrorMessage,
  isAlreadyConfirmedError,
  isExpiredConfirmationError,
  resolveEmailConfirmationOutcome,
  type EmailConfirmationOutcome,
} from './model/resolveEmailConfirmationOutcome'
