import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const initiateAvatarUploadMutation = gql`
  mutation InitiateAvatarUpload($input: [InitiateUploadInput!]!) {
    initiateUploadBatch(input: $input) {
      clientUploadId
      fileId
      uploadUrl
      expiresAt
    }
  }
`

const completeAvatarUploadMutation = gql`
  mutation CompleteAvatarUpload($input: [CompleteUploadInput!]!) {
    completeUpload(input: $input) {
      fileId
      status
      failedReason
      retryable
    }
  }
`

const retryAvatarUploadMutation = gql`
  mutation RetryAvatarUpload($input: [RetryUploadInput!]!) {
    retryUpload(input: $input) {
      fileId
      uploadUrl
      expiresAt
      attempt
    }
  }
`

const setProfilePhotoMutation = gql`
  mutation SetProfilePhoto($fileId: ID!) {
    setProfilePhoto(fileId: $fileId) {
      id
      username
      displayName
      aboutMe
      profilePictureFileId
      avatar {
        id
        url
      }
    }
  }
`

const deleteProfilePhotoMutation = gql`
  mutation DeleteProfilePhoto {
    deleteProfilePhoto
  }
`

export type AvatarUploadMimeType = 'JPEG' | 'PNG'
export type AvatarFileStatus = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED'

export type InitiateAvatarUploadInput = {
  clientUploadId: string
  mimeType: AvatarUploadMimeType
  originalName: string
  purpose: 'AVATAR'
  size: number
}

export type InitiateAvatarUploadPayload = {
  clientUploadId: string
  expiresAt: string
  fileId: string
  uploadUrl: string
}

export type CompleteAvatarUploadPayload = {
  failedReason: string | null
  fileId: string
  retryable: boolean
  status: AvatarFileStatus
}

export type RetryAvatarUploadPayload = {
  attempt: number
  expiresAt: string
  fileId: string
  uploadUrl: string
}

export type ProfilePhotoUser = {
  aboutMe: string | null
  avatar: { id: string; url: string } | null
  displayName: string | null
  id: string
  profilePictureFileId: string | null
  username: string
}

export async function initiateAvatarUpload(
  input: InitiateAvatarUploadInput[],
): Promise<InitiateAvatarUploadPayload[]> {
  const response = await apolloClient.mutate<
    { initiateUploadBatch: InitiateAvatarUploadPayload[] },
    { input: InitiateAvatarUploadInput[] }
  >({ mutation: initiateAvatarUploadMutation, variables: { input } })
  const payload = response.data?.initiateUploadBatch

  if (!payload) {
    throw new Error('Avatar upload initialization failed. Please try again.')
  }

  return payload
}

export async function completeAvatarUpload(
  input: Array<{ fileId: string }>,
): Promise<CompleteAvatarUploadPayload[]> {
  const response = await apolloClient.mutate<
    { completeUpload: CompleteAvatarUploadPayload[] },
    { input: Array<{ fileId: string }> }
  >({ mutation: completeAvatarUploadMutation, variables: { input } })
  const payload = response.data?.completeUpload

  if (!payload) {
    throw new Error('Avatar upload completion failed. Please try again.')
  }

  return payload
}

export async function retryAvatarUpload(
  input: Array<{ fileId: string }>,
): Promise<RetryAvatarUploadPayload[]> {
  const response = await apolloClient.mutate<
    { retryUpload: RetryAvatarUploadPayload[] },
    { input: Array<{ fileId: string }> }
  >({ mutation: retryAvatarUploadMutation, variables: { input } })
  const payload = response.data?.retryUpload

  if (!payload) {
    throw new Error('Avatar upload retry failed. Please try again.')
  }

  return payload
}

export async function setProfilePhoto(fileId: string): Promise<ProfilePhotoUser> {
  const response = await apolloClient.mutate<
    { setProfilePhoto: ProfilePhotoUser | null },
    { fileId: string }
  >({
    mutation: setProfilePhotoMutation,
    variables: { fileId },
    fetchPolicy: 'no-cache',
    errorPolicy: 'none',
  })
  const user = response.data?.setProfilePhoto

  if (!user) {
    throw new Error('Failed to set profile photo.')
  }

  return user
}

export async function deleteProfilePhoto(): Promise<void> {
  const response = await apolloClient.mutate<{ deleteProfilePhoto: boolean | null }>({
    mutation: deleteProfilePhotoMutation,
    fetchPolicy: 'no-cache',
    errorPolicy: 'none',
  })

  if (response.data?.deleteProfilePhoto !== true) {
    throw new Error('Failed to delete profile photo.')
  }
}
