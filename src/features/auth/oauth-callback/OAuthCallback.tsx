'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { getErrorContent, useOAuthAuth } from '@/features/auth/oauth'
import { authRoutes } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/button'
import { Text, Title } from '@/shared/ui/typography'

import styles from './oauth-callback.module.css'

export function OAuthCallback() {
  const searchParams = useSearchParams()
  const { completeOAuthAuth, errorCode, isLoading } = useOAuthAuth()
  const code = searchParams.get('code')
  const providerError = searchParams.get('error')
  const content = getErrorContent(errorCode ?? providerError)

  useEffect(() => {
    if (providerError) {
      return
    }

    void completeOAuthAuth({
      code,
    })
  }, [code, completeOAuthAuth, providerError])

  return (
    <section className={styles.root} aria-busy={isLoading || undefined}>
      {isLoading && !errorCode && !providerError ? (
        <>
          <Title level="h1">Completing sign in</Title>
          <Text color="var(--color-text-secondary)">
            Please wait while we finish secure authorization.
          </Text>
        </>
      ) : (
        <>
          <Title level="h1">{content.title}</Title>
          <Text className={styles.description} color="var(--color-text-secondary)" role="alert">
            {content.message}
          </Text>
          <Button asChild className={styles.action}>
            <Link href={authRoutes.signIn}>Back to sign in</Link>
          </Button>
        </>
      )}
    </section>
  )
}
