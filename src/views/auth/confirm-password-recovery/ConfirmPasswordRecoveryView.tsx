'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'

import { authRoutes } from '@/shared/lib/auth'
import { Text, Title } from '@/shared/ui/typography'
import { AuthFormCard } from '@/views/auth/ui/auth-form-card'
import { AuthViewShell } from '@/widgets/auth-view-shell'

import styles from './confirm-password-recovery-view.module.css'
import { PasswordRecoveryExpired } from './ui'

const getCreateNewPasswordHref = (code: string) => {
  return `${authRoutes.createNewPassword}?code=${encodeURIComponent(code)}`
}

export default function ConfirmPasswordRecoveryView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = useMemo(() => searchParams.get('code')?.trim() ?? '', [searchParams])

  useEffect(() => {
    if (!code) {
      return
    }

    router.replace(getCreateNewPasswordHref(code))
  }, [code, router])

  const hasCode = Boolean(code)

  if (!hasCode) {
    return <PasswordRecoveryExpired />
  }

  return (
    <AuthViewShell>
      <AuthFormCard>
        <Title level="h1" className={styles.title}>
          Password Recovery
        </Title>

        <div className={styles.content}>
          <Text aria-live="polite" className={styles.message}>
            Verifying your recovery link...
          </Text>
        </div>
      </AuthFormCard>
    </AuthViewShell>
  )
}
