import type { Metadata } from 'next'

import { SessionProvider } from '@/features/auth/session-management'
import { ApolloProvider } from '@/shared/api'

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
          <SessionProvider>{children}</SessionProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
