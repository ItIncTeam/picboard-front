'use client'

import { ApolloProvider as ApolloReactProvider } from '@apollo/client/react'
import type { ReactNode } from 'react'

import { apolloClient } from './client'

type ApolloProviderProps = Readonly<{
  children: ReactNode
}>

export function ApolloProvider({ children }: ApolloProviderProps) {
  return <ApolloReactProvider client={apolloClient}>{children}</ApolloReactProvider>
}
