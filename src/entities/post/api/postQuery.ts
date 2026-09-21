import { gql } from '@apollo/client'

import { postFieldsFragment } from './postFragments'

export const postQuery = gql`
  ${postFieldsFragment}

  query Post($id: String!) {
    post(id: $id) {
      ...PostFields
    }
  }
`
