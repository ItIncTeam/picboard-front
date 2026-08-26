import { visit, type DocumentNode } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

const apolloMocks = vi.hoisted(() => ({
  query: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    query: apolloMocks.query,
  },
}))

import { getUser } from './usersApi'

function getUserFieldNames(document: DocumentNode): string[] {
  let fieldNames: string[] = []

  visit(document, {
    Field(node) {
      if (node.name.value !== 'user') {
        return
      }

      fieldNames =
        node.selectionSet?.selections.flatMap((selection) =>
          selection.kind === 'Field' ? [selection.name.value] : [],
        ) ?? []

      return false
    },
  })

  return fieldNames
}

describe('user GraphQL helper', () => {
  afterEach(() => {
    apolloMocks.query.mockReset()
  })

  it('loads only public profile fields by id', async () => {
    const payload = {
      bio: 'About user',
      displayName: 'Display Name',
      id: 'user-1',
      profilePictureFileId: null,
      username: 'username',
    }

    apolloMocks.query.mockResolvedValueOnce({ data: { user: payload } })

    await expect(getUser('user-1')).resolves.toEqual(payload)

    const request = apolloMocks.query.mock.calls[0]?.[0]
    expect(request.variables).toEqual({ id: 'user-1' })
    expect(getUserFieldNames(request.query)).toEqual([
      'id',
      'username',
      'displayName',
      'bio',
      'profilePictureFileId',
    ])
  })

  it('allows a missing public user', async () => {
    apolloMocks.query.mockResolvedValueOnce({ data: { user: null } })

    await expect(getUser('missing-user')).resolves.toBeNull()
  })

  it('throws when the user field is missing', async () => {
    apolloMocks.query.mockResolvedValueOnce({ data: {} })

    await expect(getUser('user-1')).rejects.toThrow('Profile loading failed. Please try again.')
  })
})
