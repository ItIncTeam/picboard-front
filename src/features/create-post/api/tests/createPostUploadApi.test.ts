import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
  },
}))

import {
  completeUpload,
  initiateUploadBatch,
  type CompleteUploadInput,
  type InitiateUploadInput,
} from '../createPostUploadApi'

function getOperationDefinition(document: DocumentNode): OperationDefinitionNode {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition',
  )

  if (!operation) {
    throw new Error('Expected GraphQL operation definition.')
  }

  return operation
}

function getOperationName(document: DocumentNode): string | undefined {
  return getOperationDefinition(document).name?.value
}

function getVariableNames(document: DocumentNode): string[] {
  return (
    getOperationDefinition(document).variableDefinitions?.map((item) => item.variable.name.value) ??
    []
  )
}

describe('create post upload GraphQL helpers', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends upload descriptors through InitiateUploadInput array', async () => {
    const input: InitiateUploadInput[] = [
      {
        clientUploadId: 'image-1',
        mimeType: 'JPEG',
        originalName: 'post.jpg',
        purpose: 'POST_IMAGE',
        size: 1024,
      },
    ]

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        initiateUploadBatch: [
          {
            clientUploadId: 'image-1',
            expiresAt: '2026-07-03T12:00:00.000Z',
            fileId: 'file-1',
            uploadUrl: 'https://storage.example/upload',
          },
        ],
      },
    })

    await expect(initiateUploadBatch(input)).resolves.toEqual([
      {
        clientUploadId: 'image-1',
        expiresAt: '2026-07-03T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/upload',
      },
    ])

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('InitiateUploadBatch')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when initiateUploadBatch returns no payload', async () => {
    const input: InitiateUploadInput[] = [
      {
        clientUploadId: 'image-1',
        mimeType: 'PNG',
        originalName: 'post.png',
        purpose: 'POST_IMAGE',
        size: 2048,
      },
    ]

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(initiateUploadBatch(input)).rejects.toThrow(
      'Upload initialization failed. Please try again.',
    )
  })

  it('sends completed files through CompleteUploadInput array', async () => {
    const input: CompleteUploadInput[] = [
      {
        fileId: 'file-1',
      },
    ]

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        completeUpload: [
          {
            fileId: 'file-1',
            status: 'READY',
          },
        ],
      },
    })

    await expect(completeUpload(input)).resolves.toEqual([
      {
        fileId: 'file-1',
        status: 'READY',
      },
    ])

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('CompleteUpload')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when completeUpload returns no payload', async () => {
    const input: CompleteUploadInput[] = [
      {
        fileId: 'file-1',
      },
    ]

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(completeUpload(input)).rejects.toThrow(
      'Upload completion failed. Please try again.',
    )
  })
})
