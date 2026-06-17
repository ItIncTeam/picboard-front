import { I18nProvider } from '@/shared/lib/i18n'
import type { Metadata } from 'next'

import { SessionProvider } from '@/features/auth/session-management'
import { ApolloProvider } from '@/shared/api'
import { RouteHistoryTracker } from '@/shared/lib/router'
import { ToastProvider } from '@/shared/ui/toast'
import { TooltipProvider } from '@/shared/ui/tooltip'

import './globals.css'

export const metadata: Metadata = {
  title: 'Picboard',
  description: 'Picboard social media platform',
  icons: {
    icon: [
      {
        url: '/favicons/icon.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/favicons/icon-dark.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider>
          <SessionProvider>
            <I18nProvider>
              <TooltipProvider>
                <ToastProvider>
                  <RouteHistoryTracker />
                  {children}
                </ToastProvider>
              </TooltipProvider>
            </I18nProvider>
          </SessionProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
