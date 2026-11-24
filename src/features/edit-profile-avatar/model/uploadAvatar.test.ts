import { afterEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
  completeAvatarUpload: vi.fn(),
  initiateAvatarUpload: vi.fn(),
  retryAvatarUpload: vi.fn(),
}))

vi.mock('../api/avatarUploadApi', () => apiMocks)

import { uploadAvatar } from './uploadAvatar'

const future = '2099-01-01T00:00:00.000Z'

function createFile(type = 'image/jpeg'): File {
  return new File(['avatar'], type === 'image/png' ? 'avatar.png' : 'avatar.jpg', { type })
}

function mockInitiated() {
  apiMocks.initiateAvatarUpload.mockResolvedValueOnce([
    {
      clientUploadId: 'upload-1',
      expiresAt: future,
      fileId: 'file-1',
      uploadUrl: 'https://storage.example/avatar',
    },
  ])
}

describe('uploadAvatar', () => {
  afterEach(() => {
    apiMocks.completeAvatarUpload.mockReset()
    apiMocks.initiateAvatarUpload.mockReset()
    apiMocks.retryAvatarUpload.mockReset()
  })

  it('uploads the exported file and returns only a READY file id', async () => {
    const file = createFile('image/png')
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    mockInitiated()
    apiMocks.completeAvatarUpload.mockResolvedValueOnce([
      { failedReason: null, fileId: 'file-1', retryable: false, status: 'READY' },
    ])

    await expect(uploadAvatar(file, { clientUploadId: 'upload-1', fetcher })).resolves.toBe(
      'file-1',
    )

    expect(apiMocks.initiateAvatarUpload).toHaveBeenCalledWith([
      {
        clientUploadId: 'upload-1',
        mimeType: 'PNG',
        originalName: 'avatar.png',
        purpose: 'AVATAR',
        size: file.size,
      },
    ])
    expect(fetcher).toHaveBeenCalledWith(
      'https://storage.example/avatar',
      expect.objectContaining({
        body: file,
        headers: { 'Content-Type': 'image/png' },
        method: 'PUT',
      }),
    )
    expect(apiMocks.completeAvatarUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
  })

  it('does not complete or attach when storage PUT fails', async () => {
    mockInitiated()
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 400 }))

    await expect(
      uploadAvatar(createFile(), { clientUploadId: 'upload-1', fetcher }),
    ).rejects.toThrow('Avatar storage upload failed.')
    expect(apiMocks.completeAvatarUpload).not.toHaveBeenCalled()
  })

  it('gets a fresh URL after retryable completion failure before completing again', async () => {
    const file = createFile()
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    mockInitiated()
    apiMocks.completeAvatarUpload
      .mockResolvedValueOnce([
        {
          failedReason: 'Validation failed',
          fileId: 'file-1',
          retryable: true,
          status: 'FAILED',
        },
      ])
      .mockResolvedValueOnce([
        { failedReason: null, fileId: 'file-1', retryable: false, status: 'READY' },
      ])
    apiMocks.retryAvatarUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: future,
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/avatar-retry',
      },
    ])

    await expect(uploadAvatar(file, { clientUploadId: 'upload-1', fetcher })).resolves.toBe(
      'file-1',
    )

    expect(apiMocks.retryAvatarUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/avatar-retry',
      expect.objectContaining({ body: file }),
    )
    expect(apiMocks.completeAvatarUpload).toHaveBeenCalledTimes(2)
  })

  it('renews a forbidden presigned URL before retrying the PUT', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    mockInitiated()
    apiMocks.retryAvatarUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: future,
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/avatar-retry',
      },
    ])
    apiMocks.completeAvatarUpload.mockResolvedValueOnce([
      { failedReason: null, fileId: 'file-1', retryable: false, status: 'READY' },
    ])

    await uploadAvatar(createFile(), { clientUploadId: 'upload-1', fetcher })

    expect(apiMocks.retryAvatarUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
    expect(apiMocks.completeAvatarUpload).toHaveBeenCalledOnce()
  })
})
