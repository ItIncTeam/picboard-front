import { HttpLink } from '@apollo/client/link/http'

const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql'

export const httpLink = new HttpLink({
  uri: graphqlEndpoint,
  credentials: 'include',
})
