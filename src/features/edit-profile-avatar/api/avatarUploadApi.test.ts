import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@/shared/api', () => ({ apolloClient: { mutate: apolloMocks.mutate } }))

import {
  completeAvatarUpload,
  deleteProfilePhoto,
  initiateAvatarUpload,
  retryAvatarUpload,
  setProfilePhoto,
} from './avatarUploadApi'

function operationName(document: DocumentNode): string | undefined {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition',
  )

  return operation?.name?.value
}

describe('avatar upload GraphQL API', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('initializes one AVATAR upload', async () => {
    const input = [
      {
        clientUploadId: 'avatar-upload',
        mimeType: 'PNG' as const,
        originalName: 'avatar.png',
        purpose: 'AVATAR' as const,
        size: 123,
      },
    ]
    const payload = [
      {
        clientUploadId: 'avatar-upload',
        expiresAt: '2099-01-01T00:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/avatar',
      },
    ]
    apolloMocks.mutate.mockResolvedValueOnce({ data: { initiateUploadBatch: payload } })

    await expect(initiateAvatarUpload(input)).resolves.toEqual(payload)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]
    expect(operationName(request.mutation)).toBe('InitiateAvatarUpload')
    expect(request.variables).toEqual({ input })
  })

  it('completes and retries an avatar upload', async () => {
    apolloMocks.mutate
      .mockResolvedValueOnce({
        data: {
          completeUpload: [
            { failedReason: null, fileId: 'file-1', retryable: false, status: 'READY' },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          retryUpload: [
            {
              attempt: 2,
              expiresAt: '2099-01-01T00:00:00.000Z',
              fileId: 'file-1',
              uploadUrl: 'https://storage.example/retry',
            },
          ],
        },
      })

    await expect(completeAvatarUpload([{ fileId: 'file-1' }])).resolves.toHaveLength(1)
    await expect(retryAvatarUpload([{ fileId: 'file-1' }])).resolves.toHaveLength(1)
    expect(operationName(apolloMocks.mutate.mock.calls[0]?.[0].mutation)).toBe(
      'CompleteAvatarUpload',
    )
    expect(operationName(apolloMocks.mutate.mock.calls[1]?.[0].mutation)).toBe('RetryAvatarUpload')
  })

  it('sets the ready file and deletes without variables', async () => {
    const user = {
      aboutMe: null,
      avatar: { id: 'file-1', url: 'https://cdn.example/avatar.png' },
      displayName: 'User',
      id: 'user-1',
      profilePictureFileId: 'file-1',
      username: 'user',
    }
    apolloMocks.mutate
      .mockResolvedValueOnce({ data: { setProfilePhoto: user } })
      .mockResolvedValueOnce({ data: { deleteProfilePhoto: true } })

    await expect(setProfilePhoto('file-1')).resolves.toEqual(user)
    await expect(deleteProfilePhoto()).resolves.toBeUndefined()

    expect(operationName(apolloMocks.mutate.mock.calls[0]?.[0].mutation)).toBe('SetProfilePhoto')
    expect(apolloMocks.mutate.mock.calls[0]?.[0].variables).toEqual({ fileId: 'file-1' })
    expect(operationName(apolloMocks.mutate.mock.calls[1]?.[0].mutation)).toBe('DeleteProfilePhoto')
    expect(apolloMocks.mutate.mock.calls[1]?.[0]).not.toHaveProperty('variables')
  })
})
