'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { getSafeReturnToPath } from '@/shared/lib/auth'

export function useClosePostDetailsModal() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace(getSafeReturnToPath(searchParams.get('returnTo')))
  }
}
