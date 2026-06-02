import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client/core'

import { authLink, errorLink, httpLink } from './links'

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([errorLink, authLink, httpLink]),
})
