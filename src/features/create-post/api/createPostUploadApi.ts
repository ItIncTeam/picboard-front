import { gql } from '@apollo/client'

import { apolloClient } from '@/shared/api'

const initiateUploadBatchMutation = gql`
  mutation InitiateUploadBatch($input: [InitiateUploadInput!]!) {
    initiateUploadBatch(input: $input) {
      clientUploadId
      fileId
      uploadUrl
      expiresAt
    }
  }
`

const completeUploadMutation = gql`
  mutation CompleteUpload($input: [CompleteUploadInput!]!) {
    completeUpload(input: $input) {
      fileId
      status
    }
  }
`

export type UploadPurpose = 'POST_IMAGE' | 'BILL'

export type UploadMimeType = 'JPEG' | 'PNG'

export type FileStatus = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED'

export type InitiateUploadInput = {
  clientUploadId: string
  mimeType: UploadMimeType
  originalName: string
  purpose: 'POST_IMAGE'
  size: number
}

export type InitiateUploadPayload = {
  clientUploadId: string
  expiresAt: string
  fileId: string
  uploadUrl: string
}

export type CompleteUploadInput = {
  fileId: string
}

export type CompleteUploadPayload = {
  fileId: string
  status: FileStatus
}

type InitiateUploadBatchResponse = {
  initiateUploadBatch: InitiateUploadPayload[]
}

type CompleteUploadResponse = {
  completeUpload: CompleteUploadPayload[]
}

export const initiateUploadBatch = async (
  input: InitiateUploadInput[],
): Promise<InitiateUploadPayload[]> => {
  const response = await apolloClient.mutate<
    InitiateUploadBatchResponse,
    { input: InitiateUploadInput[] }
  >({
    mutation: initiateUploadBatchMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.initiateUploadBatch

  if (!payload) {
    throw new Error('Upload initialization failed. Please try again.')
  }

  return payload
}

export const completeUpload = async (
  input: CompleteUploadInput[],
): Promise<CompleteUploadPayload[]> => {
  const response = await apolloClient.mutate<
    CompleteUploadResponse,
    { input: CompleteUploadInput[] }
  >({
    mutation: completeUploadMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.completeUpload

  if (!payload) {
    throw new Error('Upload completion failed. Please try again.')
  }

  return payload
}
