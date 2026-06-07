'use client'

import { GithubIcon, GoogleIcon } from '@/shared/assets'
import { IconButton } from '@/shared/ui/icon-button'

import styles from './oauth-providers.module.css'
import type { OAuthIntent } from './model/types'

type OAuthProvidersProps = {
  intent: OAuthIntent
}

export function OAuthProviders({ intent }: OAuthProvidersProps) {
  const actionLabel = intent === 'signIn' ? 'sign-in' : 'sign-up'

  return (
    <div className={styles.list}>
      <IconButton
        className={styles.iconButton}
        disabled
        icon={GoogleIcon}
        label={`Google ${actionLabel} is not available yet`}
      />

      <IconButton
        className={styles.iconButton}
        disabled
        icon={GithubIcon}
        label={`GitHub ${actionLabel} is not available yet`}
      />
    </div>
  )
}
