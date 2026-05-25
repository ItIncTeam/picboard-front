import { notFound } from 'next/navigation'

import { isSupportedLocale } from '@/shared/i18n/config'

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!isSupportedLocale(locale)) {
    notFound()
  }

  return <>{children}</>
}
