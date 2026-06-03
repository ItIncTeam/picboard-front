'use client'

import { GithubIcon, GoogleIcon } from '@/shared/assets'

import styles from './oauth-providers.module.css'
import { useOAuthAuth } from './model/useOAuthAuth'
import type { OAuthIntent } from './model/types'

type OAuthProvidersProps = {
  intent: OAuthIntent
}

export function OAuthProviders({ intent }: OAuthProvidersProps) {
  const { signInWithProvider } = useOAuthAuth({ intent })

  return (
    <div className={styles.list}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`${intent === 'signIn' ? 'Sign in' : 'Sign up'} with Google`}
        onClick={() => void signInWithProvider('google')}
      >
        <GoogleIcon aria-hidden />
      </button>

      <button
        type="button"
        className={styles.iconButton}
        aria-label={`${intent === 'signIn' ? 'Sign in' : 'Sign up'} with GitHub`}
        onClick={() => void signInWithProvider('github')}
      >
        <GithubIcon aria-hidden />
      </button>
    </div>
  )
}
