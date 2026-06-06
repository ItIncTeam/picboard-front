import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  query: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
    query: apolloMocks.query,
  },
}))

import { logout, refreshToken } from './api'

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

describe('auth session GraphQL helpers', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
    apolloMocks.query.mockReset()
  })

  it('calls refreshToken without input variables', async () => {
    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        refreshToken: {
          accessToken: 'access-token',
        },
      },
    })

    await expect(refreshToken()).resolves.toEqual({ accessToken: 'access-token' })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('RefreshToken')
    expect(getVariableNames(request.mutation)).toEqual([])
    expect(request).not.toHaveProperty('variables')
  })

  it('calls logout without input variables', async () => {
    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        logout: 'Logged out',
      },
    })

    await expect(logout()).resolves.toBe('Logged out')

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('Logout')
    expect(getVariableNames(request.mutation)).toEqual([])
    expect(request).not.toHaveProperty('variables')
  })
})
