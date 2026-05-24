import { RoutePlaceholder } from '@/views/route-placeholder'

type AuthScreen =
  | 'confirm-password-recovery'
  | 'confirm-registration'
  | 'forgot-password'
  | 'privacy-policy'
  | 'sign-in'
  | 'sign-up'
  | 'terms'

const authScreenTitles: Record<AuthScreen, string> = {
  'confirm-password-recovery': 'Password recovery confirmation',
  'confirm-registration': 'Registration confirmation',
  'forgot-password': 'Password recovery',
  'privacy-policy': 'Privacy Policy',
  'sign-in': 'Sign In',
  'sign-up': 'Sign Up',
  terms: 'Terms of Service',
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
        '/[locale]/auth/sign-in',
        '/[locale]/auth/sign-up',
        '/[locale]/auth/forgot-password',
        '/[locale]/auth/privacy-policy',
        '/[locale]/auth/terms',
        '/[locale]/auth/confirm/registration',
        '/[locale]/auth/confirm/password-recovery',
      ]}
    />
  )
}
