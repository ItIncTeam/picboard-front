import { describe, expect, it } from 'vitest'

import { en } from '@/shared/lib/i18n/dictionaries/en'

import { getErrorContent } from './getErrorContent'

describe('getErrorContent', () => {
  it('maps known backend OAuth callback errors', () => {
    expect(getErrorContent('invalid_state', en)).toEqual({
      message: 'Your sign-in session expired or became invalid. Please start again.',
      title: 'Session expired',
    })

    expect(getErrorContent('no_code', en)).toEqual({
      message: 'We did not receive a valid sign-in response. Please try again.',
      title: 'Sign-in failed',
    })

    expect(getErrorContent('no_pkce_verifier', en)).toEqual({
      message: 'Your sign-in attempt expired before it finished. Please try again.',
      title: 'Sign-in expired',
    })

    expect(getErrorContent('unverified_email', en)).toEqual({
      message:
        'Your Google account email is not verified. Please verify it or use another sign-in method.',
      title: 'Email is not verified',
    })
  })

  it('uses default content for unexpected values', () => {
    expect(getErrorContent('unexpected_error', en)).toEqual({
      message: 'We could not complete Google sign-in. Please try again.',
      title: 'Something went wrong',
    })
  })
})
