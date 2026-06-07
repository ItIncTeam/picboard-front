import type { OAuthIntent, OAuthProvider } from './types'

type UseOAuthAuthArgs = {
  intent: OAuthIntent
}

export function useOAuthAuth({ intent }: UseOAuthAuthArgs) {
  const signInWithProvider = async (_provider: OAuthProvider) => {
    void intent
  }

  return { signInWithProvider }
}
