type OAuthErrorContent = {
  message: string
  title: string
}

const errorContentByCode = {
  invalid_state: {
    message: 'Your sign-in session expired or became invalid. Please start again.',
    title: 'Session expired',
  },
  no_code: {
    message: 'We did not receive a valid sign-in response. Please try again.',
    title: 'Sign-in failed',
  },
  no_pkce_verifier: {
    message: 'Your sign-in attempt expired before it finished. Please try again.',
    title: 'Sign-in expired',
  },
  unverified_email: {
    message:
      'Your Google account email is not verified. Please verify it or use another sign-in method.',
    title: 'Email is not verified',
  },
  unknown: {
    message: 'We could not complete Google sign-in. Please try again.',
    title: 'Something went wrong',
  },
} as const satisfies Record<string, OAuthErrorContent>

type OAuthErrorCode = keyof typeof errorContentByCode

const isOAuthErrorCode = (code: string): code is OAuthErrorCode => {
  return code in errorContentByCode
}

export const getErrorContent = (code: string | null): OAuthErrorContent => {
  if (code && isOAuthErrorCode(code)) {
    return errorContentByCode[code]
  }

  return errorContentByCode.unknown
}
