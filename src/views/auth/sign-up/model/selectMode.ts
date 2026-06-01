import type { SignUpMode } from './types'

export function selectSignUpMode(searchParams: URLSearchParams): SignUpMode {
  const status = searchParams.get('status')

  if (status === 'confirmed') {
    return 'confirmed'
  }

  if (status === 'expired') {
    return 'expired'
  }

  return 'form'
}
