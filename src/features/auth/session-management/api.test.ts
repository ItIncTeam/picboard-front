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

import { getMe, logout, refreshToken, type CurrentUser } from './api'

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

  it('loads the backend profile read-model through Me', async () => {
    const user: CurrentUser = {
      aboutMe: 'About user',
      avatar: {
        id: 'avatar-file-1',
        url: 'https://cdn.example/avatar.jpg',
      },
      city: { id: 'city-id', name: 'Berlin', nameRu: null },
      cityId: 'city-id',
      country: { code: 'DE', id: 'country-id', name: 'Germany', nameRu: 'Германия' },
      countryId: 'country-id',
      dateOfBirth: '2000-05-17',
      displayName: 'User Name',
      email: 'user@example.com',
      firstName: 'User',
      id: 'user-id',
      isConfirmed: true,
      lastName: 'Name',
      profilePictureFileId: 'avatar-file-1',
      username: 'username',
    }

    apolloMocks.query.mockResolvedValueOnce({ data: { me: user } })

    await expect(getMe()).resolves.toEqual(user)

    const request = apolloMocks.query.mock.calls[0]?.[0]
    const document = print(request.query).replace(/\s+/g, ' ')

    expect(document).toBe(
      'query Me { me { id email username isConfirmed firstName lastName displayName dateOfBirth aboutMe profilePictureFileId avatar { id url } countryId cityId country { id code name nameRu } city { id name nameRu } } }',
    )
    expect(request.fetchPolicy).toBe('network-only')
  })

  it.each([
    { city: null, country: null },
    {
      city: { id: null, name: null, nameRu: null },
      country: { code: null, id: null, name: null, nameRu: null },
    },
  ])('preserves nullable profile fields from Me: %j', async ({ city, country }) => {
    const user: CurrentUser = {
      aboutMe: null,
      avatar: null,
      city,
      cityId: null,
      country,
      countryId: null,
      dateOfBirth: null,
      displayName: null,
      email: 'user@example.com',
      firstName: null,
      id: 'user-id',
      isConfirmed: true,
      lastName: null,
      profilePictureFileId: null,
      username: 'username',
    }

    apolloMocks.query.mockResolvedValueOnce({ data: { me: user } })

    await expect(getMe()).resolves.toEqual(user)
  })

  it.each([{ data: { me: null } }, { data: {} }, {}])(
    'rejects a missing Me payload: %j',
    async (response) => {
      apolloMocks.query.mockResolvedValueOnce(response)

      await expect(getMe()).rejects.toThrow('Failed to load current user.')
    },
  )

  it.each(['Unauthorized', 'Internal server error', 'Network request failed'])(
    'propagates a rejected Me request: %s',
    async (message) => {
      const error = new Error(message)

      apolloMocks.query.mockRejectedValueOnce(error)

      await expect(getMe()).rejects.toBe(error)
      expect(apolloMocks.mutate).not.toHaveBeenCalled()
    },
  )

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
