'use client'

import { useState } from 'react'

import { ExitIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'

import { useSession } from '@/features/auth/session-management'
import { authRoutes } from '@/shared/lib/auth'
import { IconButton } from '@/shared/ui/icon-button'

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { logout } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      router.replace(authRoutes.signIn)
    }
  }

  return (
    <IconButton
      disabled={isLoggingOut}
      icon={ExitIcon}
      label={isLoggingOut ? 'Signing out' : 'Sign out'}
      onClick={handleLogout}
    />
  )
}
