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

import { signIn, type SignInInput } from './api'

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

describe('signIn GraphQL helper', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends email and password through SignInInput', async () => {
    const input: SignInInput = {
      email: 'user@example.com',
      password: 'Password1!',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        signIn: {
          accessToken: 'access-token',
          user: {
            email: input.email,
            id: 'user-id',
            isConfirmed: true,
            username: 'username',
          },
        },
      },
    })

    await expect(signIn(input)).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: input.email,
      },
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('SignIn')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })
})
