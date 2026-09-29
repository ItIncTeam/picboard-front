import type { Dictionary } from '@/shared/lib/i18n/dictionaries'

type OAuthErrorContent = {
  message: string
  title: string
}

const errorContentByCode = {
  invalid_state: 'invalidState',
  no_code: 'noCode',
  no_pkce_verifier: 'noPkceVerifier',
  unverified_email: 'unverifiedEmail',
  unknown: 'unknown',
} as const

type OAuthErrorCode = keyof typeof errorContentByCode
type OAuthErrorDictionaryKey = (typeof errorContentByCode)[OAuthErrorCode]

const isOAuthErrorCode = (code: string): code is OAuthErrorCode => {
  return code in errorContentByCode
}

const getContent = (
  errors: Dictionary['auth']['oauth']['errors'],
  key: OAuthErrorDictionaryKey,
): OAuthErrorContent => ({
  message: errors[`${key}Message`],
  title: errors[`${key}Title`],
})

export const getErrorContent = (code: string | null, t: Dictionary): OAuthErrorContent => {
  const key = code && isOAuthErrorCode(code) ? errorContentByCode[code] : errorContentByCode.unknown

  return getContent(t.auth.oauth.errors, key)
}
