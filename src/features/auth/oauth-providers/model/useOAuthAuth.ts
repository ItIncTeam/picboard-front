import type { OAuthIntent, OAuthProvider } from './types'

type UseOAuthAuthArgs = {
  intent: OAuthIntent
}

export function useOAuthAuth({ intent }: UseOAuthAuthArgs) {
  const signInWithProvider = async (provider: OAuthProvider) => {
    // TODO: implement OAuth flow (redirect/popup + callback exchange)
    console.warn('OAuth auth:', { provider, intent })
  }

  return { signInWithProvider }
}
