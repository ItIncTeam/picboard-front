import { authRoutes } from './authRoutes'

export const getSignUpConfirmedHref = (): string => {
  const params = new URLSearchParams({
    status: 'confirmed',
  })

  return `${authRoutes.signUp}?${params.toString()}`
}

export const getSignUpExpiredHref = (email?: string): string => {
  const params = new URLSearchParams({
    status: 'expired',
  })

  const trimmedEmail = email?.trim()

  if (trimmedEmail) {
    params.set('email', trimmedEmail)
  }

  return `${authRoutes.signUp}?${params.toString()}`
}
