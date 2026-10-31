import { describe, expect, it } from 'vitest'

import { collectProfileSubmitFieldErrors } from './profileSubmitErrors'

describe('collectProfileSubmitFieldErrors', () => {
  it('collects field errors and their GraphQL error code', () => {
    const error = {
      errors: [
        {
          extensions: {
            code: 'USERNAME_TAKEN',
            errors: [{ field: 'username', message: 'Username is already taken.' }],
          },
        },
      ],
    }

    expect(collectProfileSubmitFieldErrors(error)).toEqual([
      {
        code: 'USERNAME_TAKEN',
        field: 'username',
        message: 'Username is already taken.',
      },
    ])
  })

  it('ignores malformed backend error details', () => {
    expect(
      collectProfileSubmitFieldErrors({
        extensions: { code: 'BAD_USER_INPUT', errors: [{ field: 'username' }, 'invalid'] },
      }),
    ).toEqual([])
  })
})
