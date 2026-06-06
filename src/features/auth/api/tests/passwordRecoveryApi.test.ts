import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
  },
}))

import {
  passwordReset,
  setNewPassword,
  type PasswordResetInput,
  type SetNewPasswordInput,
} from '../passwordRecoveryApi'

function getOperationDefinition(document: DocumentNode): OperationDefinitionNode {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition',
  )

  if (!operation) {
    throw new Error('Expected GraphQL operation definition.')
  }

  return operation
}

function getOperationName(document: DocumentNode): string | undefined {
  return getOperationDefinition(document).name?.value
}

function getVariableNames(document: DocumentNode): string[] {
  return (
    getOperationDefinition(document).variableDefinitions?.map((item) => item.variable.name.value) ??
    []
  )
}

describe('password recovery GraphQL helpers', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends email and captchaToken through PasswordResetInput', async () => {
    const input: PasswordResetInput = {
      captchaToken: 'captcha-token',
      email: 'user@example.com',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        passwordReset: {
          message: 'Recovery email sent',
        },
      },
    })

    await expect(passwordReset(input)).resolves.toEqual({
      message: 'Recovery email sent',
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('PasswordReset')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when passwordReset returns no payload', async () => {
    const input: PasswordResetInput = {
      captchaToken: 'captcha-token',
      email: 'user@example.com',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(passwordReset(input)).rejects.toThrow('Password reset failed. Please try again.')
  })

  it('propagates passwordReset mutation errors', async () => {
    const input: PasswordResetInput = {
      captchaToken: 'captcha-token',
      email: 'user@example.com',
    }
    const error = new Error('Captcha verification failed')

    apolloMocks.mutate.mockRejectedValueOnce(error)

    await expect(passwordReset(input)).rejects.toBe(error)
  })

  it('sends code and password through SetNewPasswordInput', async () => {
    const input: SetNewPasswordInput = {
      code: 'recovery-code',
      password: 'NewPassword1!',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        setNewPassword: {
          message: 'Password updated',
        },
      },
    })

    await expect(setNewPassword(input)).resolves.toEqual({
      message: 'Password updated',
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('SetNewPassword')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when setNewPassword returns no payload', async () => {
    const input: SetNewPasswordInput = {
      code: 'recovery-code',
      password: 'NewPassword1!',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(setNewPassword(input)).rejects.toThrow('Password update failed. Please try again.')
  })

  it('propagates setNewPassword mutation errors', async () => {
    const input: SetNewPasswordInput = {
      code: 'recovery-code',
      password: 'NewPassword1!',
    }
    const error = new Error('Invalid confirmation code')

    apolloMocks.mutate.mockRejectedValueOnce(error)

    await expect(setNewPassword(input)).rejects.toBe(error)
  })
})
