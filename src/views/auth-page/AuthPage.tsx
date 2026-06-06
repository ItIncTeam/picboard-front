import { RoutePlaceholder } from '@/views/route-placeholder'

type AuthScreen =
  | 'confirm-password-recovery'
  | 'confirm-registration'
  | 'forgot-password'
  | 'sign-in'
  | 'sign-up'

const authScreenTitles: Record<AuthScreen, string> = {
  'confirm-password-recovery': 'Password recovery confirmation',
  'confirm-registration': 'Registration confirmation',
  'forgot-password': 'Password recovery',
  'sign-in': 'Sign In',
  'sign-up': 'Sign Up',
}

type AuthPageProps = {
  screen: AuthScreen
}

export function AuthPage({ screen }: AuthPageProps) {
  return (
    <RoutePlaceholder
      title={authScreenTitles[screen]}
      description="Public authentication flow from the WebApp / UI / Auth Figma section."
      figmaNode="301:4851"
      routes={[
        '/auth/sign-in',
        '/auth/sign-up',
        '/auth/forgot-password',
        '/auth/confirm/registration',
        '/auth/confirm/password-recovery',
      ]}
    />
  )
}
