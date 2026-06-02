import { ForgotPasswordForm } from '@/features/auth'
import { PublicAuthShell } from '@/widgets/public-auth-shell'
import { ForgotPasswordView } from '@/views/auth/forgot-password'

export function ForgotPasswordPage() {
  return (
    <PublicAuthShell title="Forgot Password">
      <ForgotPasswordForm />
    </PublicAuthShell>
  )
  return <ForgotPasswordView />
}
