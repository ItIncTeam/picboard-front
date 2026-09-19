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
      failedReason
      retryable
    }
  }
`

const retryUploadMutation = gql`
  mutation RetryUpload($input: [RetryUploadInput!]!) {
    retryUpload(input: $input) {
      fileId
      uploadUrl
      expiresAt
      attempt
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
  failedReason: string | null
  fileId: string
  retryable: boolean
  status: FileStatus
}

export type RetryUploadInput = {
  fileId: string
}

export type RetryUploadPayload = {
  attempt: number
  expiresAt: string
  fileId: string
  uploadUrl: string
}

type InitiateUploadBatchResponse = {
  initiateUploadBatch: InitiateUploadPayload[]
}

type CompleteUploadResponse = {
  completeUpload: CompleteUploadPayload[]
}

type RetryUploadResponse = {
  retryUpload: RetryUploadPayload[]
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

export const retryUpload = async (input: RetryUploadInput[]): Promise<RetryUploadPayload[]> => {
  const response = await apolloClient.mutate<RetryUploadResponse, { input: RetryUploadInput[] }>({
    mutation: retryUploadMutation,
    variables: {
      input,
    },
  })

  const payload = response.data?.retryUpload

  if (!payload) {
    throw new Error('Upload retry failed. Please try again.')
  }

  return payload
}
