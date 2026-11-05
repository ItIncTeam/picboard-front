import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const currentUserFields = `
  id
  email
  username
  isConfirmed
  firstName
  lastName
  displayName
  dateOfBirth
  aboutMe
  profilePictureFileId
  avatar {
    id
    url
  }
  countryId
  cityId
  country {
    id
    code
    name
    nameRu
  }
  city {
    id
    name
    nameRu
  }
`

export const meQuery = gql`
  query Me {
    me {
      ${currentUserFields}
    }
  }
`

export type Country = {
  code: string | null
  id: string | null
  name: string | null
  nameRu: string | null
}

export type City = {
  id: string | null
  name: string | null
  nameRu: string | null
}

export type CurrentUser = {
  aboutMe: string | null
  avatar: {
    id: string
    url: string
  } | null
  city: City | null
  cityId: string | null
  country: Country | null
  countryId: string | null
  dateOfBirth: string | null
  displayName: string | null
  email: string
  firstName: string | null
  id: string
  isConfirmed: boolean
  lastName: string | null
  profilePictureFileId: string | null
  username: string
}

type MeResponse = {
  me: CurrentUser | null
}

export const getMe = async (): Promise<CurrentUser> => {
  const response = await apolloClient.query<MeResponse>({
    fetchPolicy: 'network-only',
    query: meQuery,
  })

  const user = response.data?.me

  if (!user) {
    throw new Error('Failed to load current user.')
  }

  return user
}

const updateProfileMutation = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ${currentUserFields}
    }
  }
`

export type UpdateProfileInput = {
  username: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  countryId?: string | null
  cityId?: string | null
  aboutMe?: string | null
}

export async function updateProfile(input: UpdateProfileInput): Promise<CurrentUser> {
  const response = await apolloClient.mutate<
    { updateProfile: CurrentUser | null },
    { input: UpdateProfileInput }
  >({
    mutation: updateProfileMutation,
    variables: { input },
    // Session validation must happen before normalized entities can change Me.
    fetchPolicy: 'no-cache',
    errorPolicy: 'none',
  })

  const user = response.data?.updateProfile

  if (!user) {
    throw new Error('Failed to update profile.')
  }

  return user
}

export function writeCurrentUserCache(user: CurrentUser): void {
  apolloClient.writeQuery<MeResponse>({ query: meQuery, data: { me: user } })
}
