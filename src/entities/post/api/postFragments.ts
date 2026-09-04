import { gql } from '@apollo/client'

export const postFieldsFragment = gql`
  fragment PostFields on PostEntity {
    id
    ownerId
    description
    author {
      id
      username
      displayName
      profilePictureFileId
    }
    attachments {
      fileId
      sortOrder
      file {
        id
        ownerId
        originalName
        purpose
        mimeType
        size
        status
        url
      }
    }
    createdAt
    updatedAt
  }
`
