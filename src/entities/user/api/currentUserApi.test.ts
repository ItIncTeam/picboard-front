import { print } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

const apolloMocks = vi.hoisted(() => ({ mutate: vi.fn(), query: vi.fn(), writeQuery: vi.fn() }))
vi.mock('@/shared/api', () => ({ apolloClient: apolloMocks }))

import { meQuery, updateProfile, type UpdateProfileInput } from './currentUserApi'

describe('updateProfile API', () => {
  afterEach(() => vi.resetAllMocks())

  it.each([
    { username: 'username', firstName: 'First', lastName: 'Last' },
    {
      username: 'username',
      firstName: 'First',
      lastName: 'Last',
      aboutMe: null,
      dateOfBirth: null,
      countryId: null,
      cityId: null,
    },
    { username: 'username', firstName: 'First', lastName: 'Last', aboutMe: '' },
  ] satisfies UpdateProfileInput[])(
    'preserves input presence and nulls and returns the backend model: %j',
    async (input) => {
      const returned = {
        id: 'owner',
        username: 'username',
        aboutMe: null,
        country: null,
        city: null,
      }
      apolloMocks.mutate.mockResolvedValueOnce({ data: { updateProfile: returned } })
      await expect(updateProfile(input)).resolves.toBe(returned)
      const request = apolloMocks.mutate.mock.calls[0][0]
      expect(request.variables).toEqual({ input })
      expect(request.fetchPolicy).toBe('no-cache')
      expect(request.errorPolicy).toBe('none')
      const mutation = print(request.mutation).replace(/\s+/g, ' ')
      const me = print(meQuery).replace(/\s+/g, ' ')
      expect(mutation).toBe(
        me.replace(
          'query Me { me',
          'mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input)',
        ),
      )
      expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)
      expect(apolloMocks.query).not.toHaveBeenCalled()
      expect(apolloMocks.writeQuery).not.toHaveBeenCalled()
    },
  )

  it.each([{ data: { updateProfile: null } }, { data: {} }, {}])(
    'rejects missing payloads: %j',
    async (response) => {
      apolloMocks.mutate.mockResolvedValueOnce(response)
      await expect(
        updateProfile({ username: 'username', firstName: 'First', lastName: 'Last' }),
      ).rejects.toThrow('Failed to update profile.')
      expect(apolloMocks.writeQuery).not.toHaveBeenCalled()
    },
  )

  it('propagates mutation errors without extra requests or cache writes', async () => {
    const error = new Error('Username taken')
    apolloMocks.mutate.mockRejectedValueOnce(error)
    await expect(
      updateProfile({ username: 'username', firstName: 'First', lastName: 'Last' }),
    ).rejects.toBe(error)
    expect(apolloMocks.query).not.toHaveBeenCalled()
    expect(apolloMocks.writeQuery).not.toHaveBeenCalled()
  })
})
