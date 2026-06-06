import { HttpLink } from '@apollo/client/link/http'

export const graphqlEndpoint =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql')
    : '/graphql'

export const httpLink = new HttpLink({
  uri: graphqlEndpoint,
  credentials: 'include',
})
