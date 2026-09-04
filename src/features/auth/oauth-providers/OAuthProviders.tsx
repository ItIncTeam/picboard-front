'use client'

import { GithubIcon, GoogleIcon } from '@/shared/assets'
import { startOAuthProvider, type OAuthIntent, type OAuthProvider } from '@/features/auth/oauth'
import { useI18n } from '@/shared/lib/i18n'
import { IconButton } from '@/shared/ui/icon-button'

import styles from './oauth-providers.module.css'

type OAuthProvidersProps = {
  intent: OAuthIntent
}

export function OAuthProviders({ intent }: OAuthProvidersProps) {
  const { t } = useI18n()
  const googleLabel =
    intent === 'signIn' ? t.auth.oauth.signInWithGoogle : t.auth.oauth.signUpWithGoogle
  const githubLabel =
    intent === 'signIn' ? t.auth.oauth.signInWithGithub : t.auth.oauth.signUpWithGithub

  const handleProviderClick = (provider: OAuthProvider) => {
    startOAuthProvider(provider)
  }

  return (
    <div className={styles.root}>
      <div className={styles.list}>
        <IconButton
          className={styles.iconButton}
          icon={GoogleIcon}
          label={googleLabel}
          onClick={() => handleProviderClick('google')}
        />

        <IconButton
          className={styles.iconButton}
          icon={GithubIcon}
          label={githubLabel}
          onClick={() => handleProviderClick('github')}
        />
      </div>
    </div>
  )
}
