import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { describe, expect, it } from 'vitest'
import { en } from '@/shared/lib/i18n/dictionaries/en'
import { getEditProfileErrors } from './editProfileErrors'

describe('Edit Profile field errors', () => {
  it('maps backend location names and preserves all recognized field messages', () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        {
          message: 'Validation failed',
          extensions: {
            code: 'BAD_USER_INPUT',
            errors: [
              { field: 'countryId', message: 'Unknown country' },
              { field: 'cityId', message: 'Unknown city' },
              { field: 'aboutMe', message: 'Too long' },
              { field: 'unknown', message: 'Ignore' },
              null,
            ],
          },
        },
      ],
    })
    expect(getEditProfileErrors(error, en.profile.edit)).toEqual([
      { field: 'country', message: 'Unknown country', type: 'server' },
      { field: 'city', message: 'Unknown city', type: 'server' },
      { field: 'aboutMe', message: 'Too long', type: 'server' },
    ])
  })

  it('does not infer fields from unknown error codes or transport messages', () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        {
          message: 'username cityId',
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            errors: [{ field: 'username', message: 'Internal details' }],
          },
        },
      ],
    })
    expect(getEditProfileErrors(error, en.profile.edit)).toEqual([])
    expect(getEditProfileErrors(new Error('USERNAME_TAKEN'), en.profile.edit)).toEqual([])
  })
})
