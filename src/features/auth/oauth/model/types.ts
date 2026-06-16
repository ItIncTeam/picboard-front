export type OAuthProvider = 'google' | 'github'

export type OAuthIntent = 'signIn' | 'signUp'

export type CompleteOAuthAuthArgs = {
  code: string | null
}
