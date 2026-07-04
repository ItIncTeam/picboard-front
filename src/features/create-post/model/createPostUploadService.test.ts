import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPostInitialState } from './createPostReducer'
import type { CreatePostImage, CreatePostState } from './createPostTypes'

const apiMocks = vi.hoisted(() => ({
  completeUpload: vi.fn(),
  initiateUploadBatch: vi.fn(),
}))

vi.mock('../api', () => ({
  completeUpload: apiMocks.completeUpload,
  initiateUploadBatch: apiMocks.initiateUploadBatch,
}))

import { uploadCreatePostImages } from './createPostUploadService'

function createExportedImage(id: string, fileName: string, type = 'image/jpeg'): CreatePostImage {
  const file = new File([id], fileName, { type })

  return {
    id,
    name: fileName,
    file,
    fileInfo: {
      name: fileName,
      size: file.size,
      type,
      lastModified: file.lastModified,
    },
    previewUrl: `blob:${id}`,
    aspectRatio: 'original',
    filter: 'normal',
    exported: {
      file,
      objectUrl: `blob:exported-${id}`,
      fileInfo: {
        name: fileName,
        size: file.size,
        type,
        lastModified: file.lastModified,
      },
    },
  }
}

function createState(images: CreatePostImage[]): CreatePostState {
  return {
    ...createPostInitialState,
    activeImageId: images[0]?.id ?? null,
    images,
    step: 'publication',
  }
}

describe('create post upload service', () => {
  afterEach(() => {
    apiMocks.completeUpload.mockReset()
    apiMocks.initiateUploadBatch.mockReset()
  })

  it('uses image id as clientUploadId and returns ready file ids in image order', async () => {
    const firstImage = createExportedImage('image-first', 'first.jpg')
    const secondImage = createExportedImage('image-second', 'second.png', 'image/png')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: secondImage.id,
        expiresAt: '2026-07-04T12:10:00.000Z',
        fileId: 'file-second',
        uploadUrl: 'https://storage.example/second',
      },
      {
        clientUploadId: firstImage.id,
        expiresAt: '2026-07-04T12:00:00.000Z',
        fileId: 'file-first',
        uploadUrl: 'https://storage.example/first',
      },
    ])
    apiMocks.completeUpload.mockResolvedValueOnce([
      {
        fileId: 'file-second',
        status: 'READY',
      },
      {
        fileId: 'file-first',
        status: 'READY',
      },
    ])

    await expect(
      uploadCreatePostImages(createState([firstImage, secondImage]), { fetcher }),
    ).resolves.toEqual(['file-first', 'file-second'])

    expect(apiMocks.initiateUploadBatch).toHaveBeenCalledWith([
      {
        clientUploadId: firstImage.id,
        originalName: 'first.jpg',
        purpose: 'POST_IMAGE',
        mimeType: 'JPEG',
        size: firstImage.exported?.fileInfo.size,
      },
      {
        clientUploadId: secondImage.id,
        originalName: 'second.png',
        purpose: 'POST_IMAGE',
        mimeType: 'PNG',
        size: secondImage.exported?.fileInfo.size,
      },
    ])
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://storage.example/first',
      expect.objectContaining({
        method: 'PUT',
        body: firstImage.exported?.file,
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/second',
      expect.objectContaining({
        method: 'PUT',
        body: secondImage.exported?.file,
      }),
    )
    expect(apiMocks.completeUpload).toHaveBeenCalledWith([
      { fileId: 'file-first' },
      { fileId: 'file-second' },
    ])
  })

  it('throws when initiateUploadBatch does not return a payload for image id', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([])

    await expect(uploadCreatePostImages(createState([image]), { fetcher })).rejects.toThrow(
      'Upload initialization did not return a descriptor for image image-1.',
    )
    expect(fetcher).not.toHaveBeenCalled()
    expect(apiMocks.completeUpload).not.toHaveBeenCalled()
  })

  it('throws when storage PUT fails', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2026-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/first',
      },
    ])

    await expect(uploadCreatePostImages(createState([image]), { fetcher })).rejects.toThrow(
      'Storage upload failed for image image-1.',
    )
    expect(apiMocks.completeUpload).not.toHaveBeenCalled()
  })

  it('throws when completeUpload does not return READY', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2026-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/first',
      },
    ])
    apiMocks.completeUpload.mockResolvedValueOnce([
      {
        fileId: 'file-1',
        status: 'FAILED',
      },
    ])

    await expect(uploadCreatePostImages(createState([image]), { fetcher })).rejects.toThrow(
      'Upload completion for file file-1 returned FAILED.',
    )
  })
})
