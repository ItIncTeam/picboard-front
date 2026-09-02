'use client'

import { useI18n } from '@/shared/lib/i18n'

export function LoadingFallback() {
  const { t } = useI18n()

  return (
    <p aria-live="polite" role="status">
      {t.ui.loading}
    </p>
  )
}
