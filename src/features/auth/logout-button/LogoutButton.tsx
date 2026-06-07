'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from '@/features/auth/session-management'
import { LogOutIcon } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { IconButton } from '@/shared/ui/icon-button'

type LogoutButtonProps = {
  className?: string
  iconClassName?: string
  variant?: 'icon' | 'navigation'
}

export function LogoutButton({ className, iconClassName, variant = 'icon' }: LogoutButtonProps) {
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

  if (variant === 'navigation') {
    return (
      <button
        aria-label={isLoggingOut ? 'Signing out' : 'Sign out'}
        className={className}
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <LogOutIcon aria-hidden className={iconClassName} focusable="false" />
        <span>{isLoggingOut ? 'Signing out' : 'Log Out'}</span>
      </button>
    )
  }

  return (
    <IconButton
      className={className}
      disabled={isLoggingOut}
      icon={LogOutIcon}
      label={isLoggingOut ? 'Signing out' : 'Sign out'}
      onClick={handleLogout}
    />
  )
}
