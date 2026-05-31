import { ForgotPasswordForm } from '@/features/auth'
import { PublicAuthShell } from '@/widgets/public-auth-shell'

export function ForgotPasswordPage() {
  return (
    <PublicAuthShell title="Forgot Password">
      <ForgotPasswordForm />
    </PublicAuthShell>
  )
}
