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
  emailConfirmation,
  emailConfirmationResending,
  type EmailConfirmationInput,
  type EmailConfirmationResendingInput,
} from '../api'

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

describe('confirm registration GraphQL helpers', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends code through EmailConfirmationInput', async () => {
    const input: EmailConfirmationInput = {
      code: 'confirmation-code',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        emailConfirmation: {
          message: 'Email confirmed',
        },
      },
    })

    await expect(emailConfirmation(input)).resolves.toEqual({
      message: 'Email confirmed',
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('EmailConfirmation')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('sends email through ResendEmailInput', async () => {
    const input: EmailConfirmationResendingInput = {
      email: 'user@example.com',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        emailConfirmationResending: {
          message: 'Verification link sent',
        },
      },
    })

    await expect(emailConfirmationResending(input)).resolves.toEqual({
      message: 'Verification link sent',
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('EmailConfirmationResending')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })
})
