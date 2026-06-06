import { describe, expect, it } from 'vitest'

import { createNewPasswordSchema } from '../createNewPasswordSchema'

describe('createNewPasswordSchema', () => {
  it('uses the sign-up minimum password length rule', () => {
    const result = createNewPasswordSchema.safeParse({
      password: 'Aa!',
      passwordConfirmation: 'Aa!',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Minimum number of characters 6',
    )
  })

  it('uses the sign-up password complexity rule', () => {
    const result = createNewPasswordSchema.safeParse({
      password: 'password',
      passwordConfirmation: 'password',
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.some((issue) => issue.message.includes('Password must contain')),
    ).toBe(true)
  })

  it('requires password confirmation to match', () => {
    const result = createNewPasswordSchema.safeParse({
      password: 'Password1!',
      passwordConfirmation: 'Password2!',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain('The passwords must match')
  })

  it('accepts a password that matches sign-up requirements', () => {
    const result = createNewPasswordSchema.safeParse({
      password: 'Password1!',
      passwordConfirmation: 'Password1!',
    })

    expect(result.success).toBe(true)
  })
})
