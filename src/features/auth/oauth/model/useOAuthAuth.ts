'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { useSession } from '@/features/auth/session-management'
import { defaultReturnToPath, setAccessToken } from '@/shared/lib/auth'

import { exchangeOAuthCode } from '../api'
import type { CompleteOAuthAuthArgs } from './types'

type UseOAuthAuthResult = {
  completeOAuthAuth: (args: CompleteOAuthAuthArgs) => Promise<void>
  errorCode: string | null
  isLoading: boolean
}

const getOAuthErrorCode = (error: unknown): string => {
  if (hasUnverifiedEmailError(error)) {
    return 'unverified_email'
  }

  return 'unknown'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const hasUnverifiedEmailError = (value: unknown): boolean => {
  if (value instanceof Error && value.message.toLowerCase().includes('unverified_email')) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  const code = value.code
  const message = value.message
  const errors = value.errors
  const graphQLErrors = value.graphQLErrors

  return (
    code === 'unverified_email' ||
    code === 'UNVERIFIED_EMAIL' ||
    (typeof message === 'string' && message.toLowerCase().includes('unverified_email')) ||
    hasUnverifiedEmailError(value.extensions) ||
    (Array.isArray(errors) && errors.some(hasUnverifiedEmailError)) ||
    (Array.isArray(graphQLErrors) && graphQLErrors.some(hasUnverifiedEmailError))
  )
}

export function useOAuthAuth(): UseOAuthAuthResult {
  const router = useRouter()
  const { authenticateWithCurrentToken } = useSession()
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  const completeOAuthAuth = useCallback(
    async ({ code }: CompleteOAuthAuthArgs): Promise<void> => {
      setErrorCode(null)
      setIsCompleting(true)

      try {
        if (!code) {
          setErrorCode('no_code')

          return
        }

        const { accessToken } = await exchangeOAuthCode({ code })

        setAccessToken(accessToken)
        await authenticateWithCurrentToken()
        router.replace(defaultReturnToPath)
      } catch (error) {
        setErrorCode(getOAuthErrorCode(error))
      } finally {
        setIsCompleting(false)
      }
    },
    [authenticateWithCurrentToken, router],
  )

  return {
    completeOAuthAuth,
    errorCode,
    isLoading: isCompleting,
  }
}
