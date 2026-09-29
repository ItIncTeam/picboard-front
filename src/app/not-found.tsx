'use client'

import { useI18n } from '@/shared/lib/i18n'

export default function NotFound() {
  const { t } = useI18n()

  return <h1>{t.appError.notFound}</h1>
}
