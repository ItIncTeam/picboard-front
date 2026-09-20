import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPostInitialState, createPostReducer } from './createPostReducer'
import { uploadCreatePostImages } from './createPostUploadService'
import type {
  CreatePostAction,
  CreatePostImage,
  CreatePostState,
  CreatePostUploadPatch,
} from './createPostTypes'

const apiMocks = vi.hoisted(() => ({
  completeUpload: vi.fn(),
  initiateUploadBatch: vi.fn(),
  retryUpload: vi.fn(),
}))

vi.mock('../api', () => ({
  completeUpload: apiMocks.completeUpload,
  initiateUploadBatch: apiMocks.initiateUploadBatch,
  retryUpload: apiMocks.retryUpload,
}))

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

function createImageWithDifferentExportedFile(): CreatePostImage {
  const originalFile = new File(['original'], 'original.jpg', {
    type: 'image/jpeg',
    lastModified: 1,
  })
  const exportedFile = new File(['exported-edited-file'], 'edited.png', {
    type: 'image/png',
    lastModified: 2,
  })

  return {
    id: 'image-edited',
    name: originalFile.name,
    file: originalFile,
    fileInfo: {
      name: originalFile.name,
      size: originalFile.size,
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    },
    previewUrl: 'blob:original',
    aspectRatio: '4:5',
    filter: 'lark',
    exported: {
      file: exportedFile,
      objectUrl: 'blob:edited',
      fileInfo: {
        name: exportedFile.name,
        size: exportedFile.size,
        type: exportedFile.type,
        lastModified: exportedFile.lastModified,
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

function createDispatchHarness(initialState: CreatePostState) {
  let state = initialState
  const actions: CreatePostAction[] = []

  return {
    actions,
    dispatch(action: CreatePostAction) {
      actions.push(action)
      state = createPostReducer(state, action)
    },
    getState: () => state,
  }
}

function getUploadPatches(actions: CreatePostAction[]): CreatePostUploadPatch[] {
  return actions.flatMap((action) =>
    action.type === 'applyUploadBatchState' ? action.patches : [],
  )
}

function mockReadyCompletion(fileId: string) {
  apiMocks.completeUpload.mockResolvedValueOnce([
    {
      failedReason: null,
      fileId,
      retryable: false,
      status: 'READY',
    },
  ])
}

describe('create post upload service', () => {
  afterEach(() => {
    apiMocks.completeUpload.mockReset()
    apiMocks.initiateUploadBatch.mockReset()
    apiMocks.retryUpload.mockReset()
  })

  it('keeps successful upload behavior and returns ready file ids in attachment order', async () => {
    const firstImage = createExportedImage('image-first', 'first.jpg')
    const secondImage = createExportedImage('image-second', 'second.png', 'image/png')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: secondImage.id,
        expiresAt: '2099-07-04T12:10:00.000Z',
        fileId: 'file-second',
        uploadUrl: 'https://storage.example/second',
      },
      {
        clientUploadId: firstImage.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-first',
        uploadUrl: 'https://storage.example/first',
      },
    ])
    mockReadyCompletion('file-first')
    mockReadyCompletion('file-second')

    await expect(
      uploadCreatePostImages(createState([firstImage, secondImage]), { fetcher }),
    ).resolves.toEqual(['file-first', 'file-second'])

    expect(apiMocks.initiateUploadBatch).toHaveBeenCalledWith([
      {
        clientUploadId: firstImage.id,
        originalName: 'first.jpg',
        purpose: 'POST_IMAGE',
        mimeType: 'JPEG',
        size: firstImage.exported?.file.size,
      },
      {
        clientUploadId: secondImage.id,
        originalName: 'second.png',
        purpose: 'POST_IMAGE',
        mimeType: 'PNG',
        size: secondImage.exported?.file.size,
      },
    ])
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://storage.example/first',
      expect.objectContaining({
        body: firstImage.exported?.file,
        headers: { 'Content-Type': 'image/jpeg' },
        method: 'PUT',
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/second',
      expect.objectContaining({
        body: secondImage.exported?.file,
        headers: { 'Content-Type': 'image/png' },
        method: 'PUT',
      }),
    )
    expect(apiMocks.completeUpload).toHaveBeenNthCalledWith(1, [{ fileId: 'file-first' }])
    expect(apiMocks.completeUpload).toHaveBeenNthCalledWith(2, [{ fileId: 'file-second' }])
  })

  it('uploads the exact exported blob and derives size and Content-Type from it', async () => {
    const image = createImageWithDifferentExportedFile()
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-edited',
        uploadUrl: 'https://storage.example/edited',
      },
    ])
    mockReadyCompletion('file-edited')

    await uploadCreatePostImages(createState([image]), { fetcher })

    expect(apiMocks.initiateUploadBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        mimeType: 'PNG',
        size: image.exported?.file.size,
      }),
    ])
    expect(fetcher).toHaveBeenCalledWith(
      'https://storage.example/edited',
      expect.objectContaining({
        body: image.exported?.file,
        headers: { 'Content-Type': image.exported?.file.type },
      }),
    )
  })

  it.each([
    ['network error', 'network'],
    ['429', 429],
    ['5xx', 503],
  ] as const)('retries a %s on the same presigned URL', async (_label, failure) => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi.fn()
    const wait = vi.fn(async () => undefined)

    if (failure === 'network') {
      fetcher.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    } else {
      fetcher.mockResolvedValueOnce(new Response(null, { status: failure }))
    }

    fetcher.mockResolvedValueOnce(new Response(null, { status: 200 }))
    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/first',
      },
    ])
    mockReadyCompletion('file-1')

    await expect(uploadCreatePostImages(createState([image]), { fetcher, wait })).resolves.toEqual([
      'file-1',
    ])

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://storage.example/first')
    expect(fetcher.mock.calls[1]?.[0]).toBe('https://storage.example/first')
    expect(wait).toHaveBeenCalledTimes(1)
    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
  })

  it('requests a fresh URL after 403 and keeps the same fileId and exported blob', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/expired',
      },
    ])
    apiMocks.retryUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: '2099-07-04T12:15:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/fresh',
      },
    ])
    mockReadyCompletion('file-1')

    await expect(uploadCreatePostImages(createState([image]), { fetcher })).resolves.toEqual([
      'file-1',
    ])

    expect(apiMocks.retryUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/fresh',
      expect.objectContaining({ body: image.exported?.file }),
    )
  })

  it('returns a retryUpload rejection to a recoverable failed state and recovers on Retry', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const state = createState([image])
    const harness = createDispatchHarness(state)
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/expired',
      },
    ])
    apiMocks.retryUpload
      .mockRejectedValueOnce(new Error('Upload retry unavailable.'))
      .mockResolvedValueOnce([
        {
          attempt: 2,
          expiresAt: '2099-07-04T12:15:00.000Z',
          fileId: 'file-1',
          uploadUrl: 'https://storage.example/fresh',
        },
      ])

    await expect(
      uploadCreatePostImages(state, { dispatch: harness.dispatch, fetcher }),
    ).rejects.toThrow('Upload retry unavailable.')
    expect(harness.getState().images[0]?.upload).toEqual(
      expect.objectContaining({
        fileId: 'file-1',
        retryable: true,
        retryMode: 'new-url',
        status: 'failed',
        uploadUrl: 'https://storage.example/expired',
      }),
    )

    mockReadyCompletion('file-1')

    await expect(
      uploadCreatePostImages(harness.getState(), {
        dispatch: harness.dispatch,
        fetcher,
        retryImageId: image.id,
      }),
    ).resolves.toEqual(['file-1'])

    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/fresh',
      expect.objectContaining({ body: image.exported?.file }),
    )
    expect(harness.getState().images[0]?.upload?.status).toBe('ready')
  })

  it('renews an expired URL before the first PUT', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2026-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/expired',
      },
    ])
    apiMocks.retryUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: '2026-07-04T12:15:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/fresh',
      },
    ])
    mockReadyCompletion('file-1')

    await expect(
      uploadCreatePostImages(createState([image]), {
        fetcher,
        now: () => Date.parse('2026-07-04T12:05:00.000Z'),
      }),
    ).resolves.toEqual(['file-1'])

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith(
      'https://storage.example/fresh',
      expect.objectContaining({ body: image.exported?.file }),
    )
  })

  it('renews a URL that expires between same-URL PUT attempts', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const expiresAt = '2026-07-04T12:00:00.150Z'
    const beforeExpiry = Date.parse('2026-07-04T12:00:00.000Z')
    const afterExpiry = Date.parse('2026-07-04T12:00:00.200Z')
    const now = vi
      .fn()
      .mockReturnValueOnce(beforeExpiry)
      .mockReturnValueOnce(beforeExpiry)
      .mockReturnValue(afterExpiry)
    const wait = vi.fn(async () => undefined)
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt,
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/expiring',
      },
    ])
    apiMocks.retryUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: '2026-07-04T12:15:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/fresh',
      },
    ])
    mockReadyCompletion('file-1')

    await expect(
      uploadCreatePostImages(createState([image]), { fetcher, now, wait }),
    ).resolves.toEqual(['file-1'])

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://storage.example/expiring')
    expect(fetcher.mock.calls[1]?.[0]).toBe('https://storage.example/fresh')
    expect(apiMocks.retryUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
  })

  it('does not upload files that are already READY', async () => {
    const readyImage = createExportedImage('image-ready', 'ready.jpg')
    readyImage.upload = {
      fileId: 'file-ready',
      retryable: false,
      status: 'ready',
    }
    const pendingImage = createExportedImage('image-pending', 'pending.jpg')
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: pendingImage.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-pending',
        uploadUrl: 'https://storage.example/pending',
      },
    ])
    mockReadyCompletion('file-pending')

    await expect(
      uploadCreatePostImages(createState([readyImage, pendingImage]), { fetcher }),
    ).resolves.toEqual(['file-ready', 'file-pending'])

    expect(apiMocks.initiateUploadBatch).toHaveBeenCalledWith([
      expect.objectContaining({ clientUploadId: pendingImage.id }),
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(apiMocks.completeUpload).toHaveBeenCalledTimes(1)
  })

  it('requests a fresh URL before re-uploading a retryable completion failure', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    image.upload = {
      attempt: 1,
      expiresAt: '2099-07-04T12:00:00.000Z',
      fileId: 'file-1',
      status: 'uploaded',
      uploadUrl: 'https://storage.example/original',
    }
    const state = createState([image])
    const harness = createDispatchHarness(state)
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    apiMocks.completeUpload
      .mockResolvedValueOnce([
        {
          failedReason: 'Backend verification is still pending',
          fileId: 'file-1',
          retryable: true,
          status: 'FAILED',
        },
      ])
      .mockResolvedValueOnce([
        {
          failedReason: null,
          fileId: 'file-1',
          retryable: false,
          status: 'READY',
        },
      ])
    apiMocks.retryUpload.mockResolvedValueOnce([
      {
        attempt: 2,
        expiresAt: '2099-07-04T12:15:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/fresh',
      },
    ])

    await expect(
      uploadCreatePostImages(state, { dispatch: harness.dispatch, fetcher }),
    ).resolves.toEqual([])
    expect(harness.getState().images[0]?.upload).toEqual(
      expect.objectContaining({
        attempt: 1,
        retryable: true,
        retryMode: 'new-url',
        status: 'failed',
      }),
    )
    expect(apiMocks.completeUpload).toHaveBeenCalledTimes(1)
    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()

    await expect(
      uploadCreatePostImages(harness.getState(), {
        dispatch: harness.dispatch,
        fetcher,
        retryImageId: image.id,
      }),
    ).resolves.toEqual(['file-1'])

    expect(apiMocks.completeUpload).toHaveBeenCalledTimes(2)
    expect(apiMocks.retryUpload).toHaveBeenCalledWith([{ fileId: 'file-1' }])
    expect(fetcher).toHaveBeenCalledWith(
      'https://storage.example/fresh',
      expect.objectContaining({ body: image.exported?.file }),
    )
  })

  it('does not retry a non-retryable FAILED file', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    image.upload = {
      expiresAt: '2099-07-04T12:00:00.000Z',
      fileId: 'file-1',
      retryable: false,
      status: 'failed',
      uploadUrl: 'https://storage.example/first',
    }
    const fetcher = vi.fn()

    await expect(
      uploadCreatePostImages(createState([image]), {
        fetcher,
        retryImageId: image.id,
      }),
    ).resolves.toEqual([])

    expect(apiMocks.completeUpload).not.toHaveBeenCalled()
    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('stops fresh-URL retries at backend attempt 5', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    image.upload = {
      attempt: 5,
      expiresAt: '2099-07-04T12:00:00.000Z',
      fileId: 'file-1',
      retryable: true,
      retryMode: 'new-url',
      status: 'failed',
      uploadUrl: 'https://storage.example/attempt-5',
    }
    const state = createState([image])
    const harness = createDispatchHarness(state)

    await expect(
      uploadCreatePostImages(state, {
        dispatch: harness.dispatch,
        retryImageId: image.id,
      }),
    ).resolves.toEqual([])

    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
    expect(harness.getState().images[0]?.upload).toEqual(
      expect.objectContaining({ attempt: 5, retryable: false, status: 'failed' }),
    )
  })

  it('requires file replacement when completion fails at backend attempt 5', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    image.upload = {
      attempt: 5,
      expiresAt: '2099-07-04T12:00:00.000Z',
      fileId: 'file-1',
      status: 'uploaded',
      uploadUrl: 'https://storage.example/attempt-5',
    }
    const state = createState([image])
    const harness = createDispatchHarness(state)
    const fetcher = vi.fn()

    apiMocks.completeUpload.mockResolvedValueOnce([
      {
        failedReason: 'Verification is not ready yet.',
        fileId: 'file-1',
        retryable: true,
        status: 'FAILED',
      },
    ])

    await expect(
      uploadCreatePostImages(state, { dispatch: harness.dispatch, fetcher }),
    ).resolves.toEqual([])
    expect(harness.getState().images[0]?.upload).toEqual(
      expect.objectContaining({
        attempt: 5,
        retryable: false,
        status: 'failed',
      }),
    )

    await expect(
      uploadCreatePostImages(harness.getState(), {
        dispatch: harness.dispatch,
        fetcher,
        retryImageId: image.id,
      }),
    ).resolves.toEqual([])

    expect(apiMocks.completeUpload).toHaveBeenCalledTimes(1)
    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('bounds same-URL retries and exposes a retryable file state', async () => {
    const image = createExportedImage('image-1', 'first.jpg')
    const state = createState([image])
    const harness = createDispatchHarness(state)
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }))
    const wait = vi.fn(async () => undefined)

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([
      {
        clientUploadId: image.id,
        expiresAt: '2099-07-04T12:00:00.000Z',
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/first',
      },
    ])

    await expect(
      uploadCreatePostImages(state, { dispatch: harness.dispatch, fetcher, wait }),
    ).resolves.toEqual([])

    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(wait).toHaveBeenCalledTimes(2)
    expect(apiMocks.retryUpload).not.toHaveBeenCalled()
    expect(getUploadPatches(harness.actions).at(-1)).toEqual(
      expect.objectContaining({
        imageId: image.id,
        retryable: true,
        retryMode: 'same-url',
        status: 'failed',
      }),
    )
  })

  it('throws when initiateUploadBatch omits an image descriptor', async () => {
    const image = createExportedImage('image-1', 'first.jpg')

    apiMocks.initiateUploadBatch.mockResolvedValueOnce([])

    await expect(uploadCreatePostImages(createState([image]))).rejects.toThrow(
      'Upload initialization did not return a descriptor for image image-1.',
    )
    expect(apiMocks.completeUpload).not.toHaveBeenCalled()
  })
})
