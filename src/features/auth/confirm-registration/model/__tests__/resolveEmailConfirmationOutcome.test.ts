import { describe, expect, it } from 'vitest'

import {
  emailConfirmationFallbackErrorMessage,
  getEmailConfirmationErrorMessage,
  isAlreadyConfirmedError,
  isExpiredConfirmationError,
  resolveEmailConfirmationOutcome,
} from '../resolveEmailConfirmationOutcome'

describe('resolveEmailConfirmationOutcome', () => {
  it('maps already confirmed errors to confirmed outcome', () => {
    expect(isAlreadyConfirmedError('Email already confirmed')).toBe(true)
    expect(resolveEmailConfirmationOutcome(new Error('Email already confirmed'))).toEqual({
      kind: 'confirmed',
    })
  })

  it('maps expired and invalid code errors to expired outcome', () => {
    expect(isExpiredConfirmationError('Confirmation link expired')).toBe(true)
    expect(isExpiredConfirmationError('Invalid confirmation code')).toBe(true)
    expect(isExpiredConfirmationError('Invalid code')).toBe(true)

    expect(resolveEmailConfirmationOutcome(new Error('Invalid confirmation code'))).toEqual({
      kind: 'expired',
    })
  })

  it('maps unknown errors to unknown-error outcome', () => {
    expect(resolveEmailConfirmationOutcome(new Error('Failed to fetch'))).toEqual({
      kind: 'unknown-error',
      message: 'Failed to fetch',
    })
  })

  it('uses fallback message for non-error values', () => {
    expect(getEmailConfirmationErrorMessage(null)).toBe(emailConfirmationFallbackErrorMessage)
    expect(resolveEmailConfirmationOutcome(null)).toEqual({
      kind: 'unknown-error',
      message: emailConfirmationFallbackErrorMessage,
    })
  })
})
