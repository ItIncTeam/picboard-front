import { parse, print, visit, Kind } from 'graphql'

import { postFieldsFragment } from '@/entities/post/api/postFragments'

const document = parse(`
  ${print(postFieldsFragment)}

  query InitialProfile($id: String!, $input: ProfilePostsInput!) {
    user(id: $id) {
      id
      username
      displayName
      aboutMe
      profilePictureFileId
      avatar { id url }
    }
    profilePosts(input: $input) {
      edges {
        cursor
        node { ...PostFields }
      }
      pageInfo { startCursor endCursor hasNextPage }
    }
  }
`)

export const initialProfileQuery = print(
  visit(document, {
    SelectionSet(node) {
      return {
        ...node,
        selections: [
          ...node.selections,
          { kind: Kind.FIELD, name: { kind: Kind.NAME, value: '__typename' } },
        ],
      }
    },
  }),
)
