'use client'

import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

import { emailConfirmation } from '@/features/auth/confirm-registration'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './confirm-registration-view.module.css'

type ConfirmationState =
  | {
      kind: 'loading'
      message: string
    }
  | {
      kind: 'success'
      message: string
    }
  | {
      kind: 'missing-code'
      message: string
    }
  | {
      kind: 'error'
      message: string
    }

type ConfirmationResult = Extract<ConfirmationState, { kind: 'success' | 'error' }> & {
  code: string
}

const fallbackErrorMessage = 'Email confirmation failed. Please try again.'
const loadingState: ConfirmationState = {
  kind: 'loading',
  message: 'Confirming your email...',
}
const missingCodeState: ConfirmationState = {
  kind: 'missing-code',
  message: 'Confirmation code is missing',
}

const getErrorMessage = (error: unknown) => {
  return error instanceof Error && error.message.length > 0 ? error.message : fallbackErrorMessage
}

const isAlreadyConfirmedError = (message: string) => {
  return message.toLowerCase().includes('email already confirmed')
}

const getConfirmationState = (
  code: string,
  result: ConfirmationResult | null,
): ConfirmationState => {
  if (!code) {
    return missingCodeState
  }

  if (result?.code === code) {
    return result
  }

  return loadingState
}

function ConfirmRegistrationViewContent() {
  const searchParams = useSearchParams()
  const code = useMemo(() => searchParams.get('code')?.trim() ?? '', [searchParams])
  const confirmedCodeRef = useRef<string | null>(null)
  const [result, setResult] = useState<ConfirmationResult | null>(null)

  useEffect(() => {
    if (!code) {
      return
    }

    if (confirmedCodeRef.current === code) {
      return
    }

    confirmedCodeRef.current = code
    let isActive = true

    void emailConfirmation({ code })
      .then((payload) => {
        if (!isActive) {
          return
        }

        setResult({
          kind: 'success',
          code,
          message: payload.message,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        const message = getErrorMessage(error)

        if (isAlreadyConfirmedError(message)) {
          setResult({
            kind: 'success',
            code,
            message: 'Email already confirmed. You can sign in.',
          })
          return
        }

        setResult({
          kind: 'error',
          code,
          message,
        })
      })

    return () => {
      isActive = false
    }
  }, [code])

  const state = getConfirmationState(code, result)

  const title = state.kind === 'success' ? 'Email Confirmed' : 'Registration Confirmation'

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          {title}
        </Title>

        <div className={styles.content}>
          <Text
            aria-live="polite"
            className={styles.message}
            color={state.kind === 'error' ? 'var(--color-status-danger)' : undefined}
          >
            {state.message}
          </Text>

          <Button asChild className={styles.signInButton}>
            <NextLink href="/auth/sign-in">Sign In</NextLink>
          </Button>
        </div>
      </AuthFormCard>
    </AuthViewShell>
  )
}

export function ConfirmRegistrationView() {
  return (
    <Suspense fallback={null}>
      <ConfirmRegistrationViewContent />
    </Suspense>
  )
}
