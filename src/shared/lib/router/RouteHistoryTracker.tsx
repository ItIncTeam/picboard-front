'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { rememberRoutePathname } from './createPostCloseRoute'

export function RouteHistoryTracker() {
  const pathname = usePathname()

  useEffect(() => {
    rememberRoutePathname(pathname)
  }, [pathname])

  return null
}
