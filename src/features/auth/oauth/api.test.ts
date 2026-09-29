import type { DocumentNode, OperationDefinitionNode } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
  },
}))

import { exchangeOAuthCode, type OAuthExchangeCodeInput } from './api'

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

describe('exchangeOAuthCode GraphQL helper', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends code through OAuthExchangeCodeInput', async () => {
    const input: OAuthExchangeCodeInput = {
      code: 'oauth-code',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        exchangeOAuthCode: {
          accessToken: 'access-token',
          user: {
            email: 'user@example.com',
            id: 'user-id',
            isConfirmed: true,
            username: 'username',
          },
        },
      },
    })

    await expect(exchangeOAuthCode(input)).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: 'user@example.com',
      },
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('ExchangeOAuthCode')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })
})
