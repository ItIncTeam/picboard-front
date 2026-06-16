'use client'

import { GithubIcon, GoogleIcon } from '@/shared/assets'
import { startOAuthProvider, type OAuthIntent, type OAuthProvider } from '@/features/auth/oauth'
import { IconButton } from '@/shared/ui/icon-button'

import styles from './oauth-providers.module.css'

type OAuthProvidersProps = {
  intent: OAuthIntent
}

export function OAuthProviders({ intent }: OAuthProvidersProps) {
  const actionText = intent === 'signIn' ? 'Sign in' : 'Sign up'

  const handleProviderClick = (provider: OAuthProvider) => {
    startOAuthProvider(provider)
  }

  return (
    <div className={styles.root}>
      <div className={styles.list}>
        <IconButton
          className={styles.iconButton}
          icon={GoogleIcon}
          label={`${actionText} with Google`}
          onClick={() => handleProviderClick('google')}
        />

        <IconButton
          className={styles.iconButton}
          icon={GithubIcon}
          label={`${actionText} with GitHub`}
          onClick={() => handleProviderClick('github')}
        />
      </div>
    </div>
  )
}
