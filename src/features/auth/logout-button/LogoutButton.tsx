'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from '@/features/auth/session-management'
import { LogOutIcon } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { IconButton } from '@/shared/ui/icon-button'
import { Tooltip } from '@/shared/ui/tooltip'

type LogoutButtonProps = {
  className?: string
  iconClassName?: string
  tooltip?: string
  variant?: 'icon' | 'navigation'
}

export function LogoutButton({
  className,
  iconClassName,
  tooltip,
  variant = 'icon',
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { logout } = useSession()
  const { t } = useI18n()
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
    const button = (
      <button
        aria-label={isLoggingOut ? t.auth.logout.signingOut : t.auth.logout.signOut}
        className={className}
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <LogOutIcon aria-hidden className={iconClassName} focusable="false" />
        <span>{isLoggingOut ? t.auth.logout.signingOut : t.auth.logout.logOut}</span>
      </button>
    )

    if (!tooltip) {
      return button
    }

    return (
      <Tooltip content={tooltip} side="right">
        {button}
      </Tooltip>
    )
  }

  return (
    <IconButton
      className={className}
      disabled={isLoggingOut}
      icon={LogOutIcon}
      label={isLoggingOut ? t.auth.logout.signingOut : t.auth.logout.signOut}
      onClick={handleLogout}
      tooltip={tooltip}
    />
  )
}
