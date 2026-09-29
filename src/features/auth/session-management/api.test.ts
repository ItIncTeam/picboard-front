import { afterEach, describe, expect, it, vi } from 'vitest'
import { print, type DocumentNode, type OperationDefinitionNode } from 'graphql'

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

import { getMe, logout, refreshToken } from './api'

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

  it('loads private Me fields with a nullable avatar', async () => {
    const user = {
      avatar: {
        id: 'avatar-file-1',
        url: 'https://cdn.example/avatar.jpg',
      },
      bio: null,
      displayName: 'User Name',
      email: 'user@example.com',
      id: 'user-id',
      isConfirmed: true,
      profilePictureFileId: 'avatar-file-1',
      username: 'username',
    }

    apolloMocks.query.mockResolvedValueOnce({ data: { me: user } })

    await expect(getMe()).resolves.toEqual(user)

    const request = apolloMocks.query.mock.calls[0]?.[0]
    const document = print(request.query).replace(/\s+/g, ' ')

    expect(document).toContain('avatar { id url }')
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
