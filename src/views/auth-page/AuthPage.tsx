'use client'

import { useI18n } from '@/shared/lib/i18n'
import { RoutePlaceholder } from '@/views/route-placeholder'

type AuthScreen =
  | 'confirm-password-recovery'
  | 'confirm-registration'
  | 'forgot-password'
  | 'sign-in'
  | 'sign-up'

type AuthPageProps = {
  screen: AuthScreen
}

export function AuthPage({ screen }: AuthPageProps) {
  const { t } = useI18n()
  const authScreenTitles: Record<AuthScreen, string> = {
    'confirm-password-recovery': t.routePlaceholder.authSections.confirmPasswordRecovery,
    'confirm-registration': t.routePlaceholder.authSections.confirmRegistration,
    'forgot-password': t.routePlaceholder.authSections.forgotPassword,
    'sign-in': t.routePlaceholder.authSections.signIn,
    'sign-up': t.routePlaceholder.authSections.signUp,
  }

  return (
    <RoutePlaceholder
      title={authScreenTitles[screen]}
      description={t.routePlaceholder.publicAuthDescription}
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
