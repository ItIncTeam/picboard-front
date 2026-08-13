import { describe, expect, it } from 'vitest'

import { createPostInitialState, createPostReducer } from './createPostReducer'
import type { CreatePostImage, CreatePostState } from './createPostTypes'

const firstImage: CreatePostImage = {
  id: 'image-1',
  name: 'first.jpg',
  aspectRatio: '1:1',
  filter: 'normal',
}

const secondImage: CreatePostImage = {
  id: 'image-2',
  name: 'second.jpg',
  aspectRatio: '4:5',
  filter: 'normal',
}

const createExportedImage = () => ({
  file: new File(['edited'], 'edited.jpg', {
    type: 'image/jpeg',
  }),
  objectUrl: 'blob:edited',
  fileInfo: {
    name: 'edited.jpg',
    size: 6,
    type: 'image/jpeg',
    lastModified: 1,
  },
})

const cropGeometry = {
  coordinates: { height: 320, left: 10, top: 20, width: 320 },
  transforms: { flip: { horizontal: false, vertical: false }, rotate: 0 },
  visibleArea: { height: 640, left: 0, top: 0, width: 640 },
}

describe('createPostReducer', () => {
  it('resets state to initial state', () => {
    const dirtyState: CreatePostState = {
      ...createPostInitialState,
      step: 'publication',
      caption: 'Test caption',
      hasUnsavedData: true,
      images: [
        {
          id: 'image-1',
          name: 'test.jpg',
          aspectRatio: '1:1',
          filter: 'normal',
        },
      ],
      activeImageId: 'image-1',
      isPublishing: true,
    }

    const result = createPostReducer(dirtyState, { type: 'reset' })

    expect(result).toEqual(createPostInitialState)
  })

  it('moves to the next step', () => {
    expect(createPostReducer(createPostInitialState, { type: 'goNext' }).step).toBe('crop')

    expect(
      createPostReducer({ ...createPostInitialState, step: 'crop' }, { type: 'goNext' }).step,
    ).toBe('filters')

    expect(
      createPostReducer({ ...createPostInitialState, step: 'filters' }, { type: 'goNext' }).step,
    ).toBe('publication')

    expect(
      createPostReducer({ ...createPostInitialState, step: 'publication' }, { type: 'goNext' })
        .step,
    ).toBe('publication')
  })

  it('moves to the previous step', () => {
    expect(
      createPostReducer({ ...createPostInitialState, step: 'publication' }, { type: 'goBack' })
        .step,
    ).toBe('filters')

    expect(
      createPostReducer({ ...createPostInitialState, step: 'filters' }, { type: 'goBack' }).step,
    ).toBe('crop')

    expect(
      createPostReducer({ ...createPostInitialState, step: 'crop' }, { type: 'goBack' }).step,
    ).toBe('upload')

    expect(createPostReducer(createPostInitialState, { type: 'goBack' }).step).toBe('upload')
  })

  it('appends new images', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage],
        activeImageId: firstImage.id,
      },
      { type: 'addImages', images: [secondImage] },
    )

    expect(result.images).toEqual([firstImage, secondImage])
  })

  it('sets activeImageId to first added image when there was no active image', () => {
    const result = createPostReducer(createPostInitialState, {
      type: 'addImages',
      images: [firstImage, secondImage],
    })

    expect(result.activeImageId).toBe(firstImage.id)
  })

  it('keeps existing activeImageId when it already exists', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage],
        activeImageId: firstImage.id,
      },
      { type: 'addImages', images: [secondImage] },
    )

    expect(result.activeImageId).toBe(firstImage.id)
  })

  it('marks state as unsaved when images are added', () => {
    const result = createPostReducer(createPostInitialState, {
      type: 'addImages',
      images: [firstImage],
    })

    expect(result.hasUnsavedData).toBe(true)
  })

  it('removes image by id', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
        activeImageId: firstImage.id,
      },
      { type: 'removeImage', imageId: secondImage.id },
    )

    expect(result.images).toEqual([firstImage])
  })

  it('clears activeImageId when removed image was active and no images remain', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage],
        activeImageId: firstImage.id,
      },
      { type: 'removeImage', imageId: firstImage.id },
    )

    expect(result.activeImageId).toBeNull()
  })

  it('switches activeImageId to first remaining image when active image was removed', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
        activeImageId: firstImage.id,
      },
      { type: 'removeImage', imageId: firstImage.id },
    )

    expect(result.activeImageId).toBe(secondImage.id)
  })

  it('keeps activeImageId when removed image was not active', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
        activeImageId: firstImage.id,
      },
      { type: 'removeImage', imageId: secondImage.id },
    )

    expect(result.activeImageId).toBe(firstImage.id)
  })

  it('marks state as unsaved only when an image was removed', () => {
    const unchangedResult = createPostReducer(createPostInitialState, {
      type: 'removeImage',
      imageId: firstImage.id,
    })
    const changedResult = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage],
        activeImageId: firstImage.id,
      },
      { type: 'removeImage', imageId: firstImage.id },
    )

    expect(unchangedResult.hasUnsavedData).toBe(false)
    expect(changedResult.hasUnsavedData).toBe(true)
  })

  it('updates activeImageId', () => {
    const result = createPostReducer(createPostInitialState, {
      type: 'setActiveImage',
      imageId: firstImage.id,
    })

    expect(result.activeImageId).toBe(firstImage.id)
  })

  it('updates caption', () => {
    const result = createPostReducer(createPostInitialState, {
      type: 'setCaption',
      caption: 'Test caption',
    })

    expect(result.caption).toBe('Test caption')
  })

  it('marks state as unsaved when caption is updated', () => {
    const result = createPostReducer(createPostInitialState, {
      type: 'setCaption',
      caption: 'Test caption',
    })

    expect(result.hasUnsavedData).toBe(true)
  })

  it('updates image aspect ratio by image id and clears stale crop/export/upload state', () => {
    const exported = createExportedImage()
    const imageWithExportAndUpload: CreatePostImage = {
      ...firstImage,
      cropGeometry,
      cropped: exported,
      exported,
      upload: {
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/upload',
        expiresAt: '2026-06-19T12:00:00.000Z',
        status: 'ready',
      },
    }

    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [imageWithExportAndUpload, secondImage],
      },
      {
        type: 'setImageAspectRatio',
        aspectRatio: '16:9',
        imageId: firstImage.id,
      },
    )

    expect(result.images[0]).toEqual({
      ...firstImage,
      aspectRatio: '16:9',
      cropGeometry: undefined,
      cropped: undefined,
      exported: undefined,
      upload: undefined,
    })
    expect(result.images[1]).toBe(secondImage)
    expect(result.hasUnsavedData).toBe(true)
  })

  it('returns same state when image aspect ratio is unchanged', () => {
    const state = {
      ...createPostInitialState,
      images: [firstImage],
    }

    const result = createPostReducer(state, {
      type: 'setImageAspectRatio',
      aspectRatio: firstImage.aspectRatio,
      imageId: firstImage.id,
    })

    expect(result).toBe(state)
  })

  it('stores crop geometry by image id without changing image order', () => {
    const result = createPostReducer(
      { ...createPostInitialState, images: [firstImage, secondImage] },
      {
        type: 'setImageCropGeometry',
        geometry: cropGeometry,
        imageId: secondImage.id,
      },
    )

    expect(result.images[0]).toBe(firstImage)
    expect(result.images[1]).toEqual({ ...secondImage, cropGeometry })
  })

  it('invalidates cropped base, final export, and upload when crop geometry changes', () => {
    const cropped = createExportedImage()
    const exported = { ...createExportedImage(), objectUrl: 'blob:filtered' }
    const image: CreatePostImage = {
      ...firstImage,
      cropGeometry,
      cropped,
      exported,
      upload: { fileId: 'file-1', status: 'ready' },
    }
    const nextGeometry = {
      ...cropGeometry,
      coordinates: { ...cropGeometry.coordinates, left: 24 },
    }

    const result = createPostReducer(
      { ...createPostInitialState, images: [image] },
      { type: 'setImageCropGeometry', geometry: nextGeometry, imageId: image.id },
    )

    expect(result.images[0]).toEqual({
      ...firstImage,
      cropGeometry: nextGeometry,
      cropped: undefined,
      exported: undefined,
      upload: undefined,
    })
  })

  it('keeps crop artifacts when crop geometry is unchanged', () => {
    const cropped = createExportedImage()
    const exported = { ...createExportedImage(), objectUrl: 'blob:filtered' }
    const image: CreatePostImage = {
      ...firstImage,
      cropGeometry,
      cropped,
      exported,
    }
    const state = { ...createPostInitialState, images: [image] }

    const result = createPostReducer(state, {
      type: 'setImageCropGeometry',
      geometry: {
        coordinates: { ...cropGeometry.coordinates },
        transforms: {
          flip: { ...cropGeometry.transforms.flip },
          rotate: cropGeometry.transforms.rotate,
        },
        visibleArea: { ...cropGeometry.visibleArea },
      },
      imageId: image.id,
    })

    expect(result).toBe(state)
  })

  it('stores cropped base and uses it as final export for the normal filter', () => {
    const cropped = createExportedImage()

    const result = createPostReducer(
      { ...createPostInitialState, images: [firstImage, secondImage] },
      {
        type: 'setImageCropped',
        cropped,
        geometry: cropGeometry,
        imageId: firstImage.id,
      },
    )

    expect(result.images[0]).toEqual({
      ...firstImage,
      cropGeometry,
      cropped,
      exported: cropped,
      upload: undefined,
    })
    expect(result.images[1]).toBe(secondImage)
  })

  it('preserves a downstream final export when the same cropped base is recommitted', () => {
    const cropped = createExportedImage()
    const exported = { ...createExportedImage(), objectUrl: 'blob:filtered' }
    const image: CreatePostImage = {
      ...firstImage,
      cropGeometry,
      cropped,
      exported,
    }

    const result = createPostReducer(
      { ...createPostInitialState, images: [image] },
      { type: 'setImageCropped', cropped, geometry: cropGeometry, imageId: image.id },
    )

    expect(result.images[0]?.cropped).toBe(cropped)
    expect(result.images[0]?.exported).toBe(exported)
  })

  it('updates image filter by image id, preserves cropped base, and clears final export/upload', () => {
    const exported = createExportedImage()
    const cropped = { ...createExportedImage(), objectUrl: 'blob:cropped' }
    const imageWithExportAndUpload: CreatePostImage = {
      ...firstImage,
      cropGeometry,
      cropped,
      exported,
      upload: {
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/upload',
        expiresAt: '2026-06-19T12:00:00.000Z',
        status: 'ready',
      },
    }

    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [imageWithExportAndUpload, secondImage],
      },
      {
        type: 'setImageFilter',
        filter: 'moon',
        imageId: firstImage.id,
      },
    )

    expect(result.images[0]).toEqual({
      ...firstImage,
      cropGeometry,
      cropped,
      filter: 'moon',
      exported: undefined,
      upload: undefined,
    })
    expect(result.images[1]).toBe(secondImage)
    expect(result.hasUnsavedData).toBe(true)
  })

  it('returns same state when image filter is unchanged', () => {
    const state = {
      ...createPostInitialState,
      images: [firstImage],
    }

    const result = createPostReducer(state, {
      type: 'setImageFilter',
      filter: firstImage.filter,
      imageId: firstImage.id,
    })

    expect(result).toBe(state)
  })

  it('stores exported file by image id', () => {
    const exported = createExportedImage()
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
      },
      {
        type: 'setImageExported',
        imageId: secondImage.id,
        exported,
      },
    )

    expect(result.images[0]).toBe(firstImage)
    expect(result.images[1]).toEqual({
      ...secondImage,
      exported,
      upload: undefined,
    })
    expect(result.hasUnsavedData).toBe(true)
  })

  it('clears upload state when exported file changes', () => {
    const exported = createExportedImage()
    const imageWithUpload: CreatePostImage = {
      ...firstImage,
      upload: {
        fileId: 'file-1',
        uploadUrl: 'https://storage.example/upload',
        expiresAt: '2026-06-19T12:00:00.000Z',
        status: 'ready',
      },
    }

    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [imageWithUpload],
      },
      {
        type: 'setImageExported',
        imageId: imageWithUpload.id,
        exported,
      },
    )

    expect(result.images[0]).toEqual({
      ...firstImage,
      exported,
      upload: undefined,
    })
  })

  it('sets publishing state', () => {
    const state = createPostReducer(createPostInitialState, {
      type: 'setPublishing',
      isPublishing: true,
    })

    expect(state.isPublishing).toBe(true)
    expect(state.hasUnsavedData).toBe(false)
  })

  it('returns same state when publishing state is unchanged', () => {
    const state = {
      ...createPostInitialState,
      isPublishing: true,
    }

    const nextState = createPostReducer(state, {
      type: 'setPublishing',
      isPublishing: true,
    })

    expect(nextState).toBe(state)
  })

  it('applies upload patch by image id', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
      },
      {
        type: 'applyUploadBatchState',
        patches: [
          {
            imageId: secondImage.id,
            fileId: 'file-2',
            uploadUrl: 'https://storage.example/upload-2',
            expiresAt: '2026-06-19T12:00:00.000Z',
            status: 'uploading',
          },
        ],
      },
    )

    expect(result.images[0]).toBe(firstImage)
    expect(result.images[1]?.upload).toEqual({
      fileId: 'file-2',
      uploadUrl: 'https://storage.example/upload-2',
      expiresAt: '2026-06-19T12:00:00.000Z',
      status: 'uploading',
    })
  })

  it('ignores upload patches for unknown image ids', () => {
    const state = {
      ...createPostInitialState,
      images: [firstImage],
    }

    const result = createPostReducer(state, {
      type: 'applyUploadBatchState',
      patches: [
        {
          imageId: 'missing-image',
          fileId: 'file-missing',
          status: 'uploading',
        },
      ],
    })

    expect(result).toBe(state)
  })

  it('maps upload patches by image id regardless of patch order', () => {
    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [firstImage, secondImage],
      },
      {
        type: 'applyUploadBatchState',
        patches: [
          {
            imageId: secondImage.id,
            fileId: 'file-2',
            status: 'uploading',
          },
          {
            imageId: firstImage.id,
            fileId: 'file-1',
            status: 'ready',
          },
        ],
      },
    )

    expect(result.images[0]?.upload?.fileId).toBe('file-1')
    expect(result.images[0]?.upload?.status).toBe('ready')
    expect(result.images[1]?.upload?.fileId).toBe('file-2')
    expect(result.images[1]?.upload?.status).toBe('uploading')
  })

  it('clears stale upload error when status becomes ready', () => {
    const imageWithError: CreatePostImage = {
      ...firstImage,
      upload: {
        fileId: 'file-1',
        status: 'failed',
        error: 'Upload failed',
      },
    }

    const result = createPostReducer(
      {
        ...createPostInitialState,
        images: [imageWithError],
      },
      {
        type: 'applyUploadBatchState',
        patches: [
          {
            imageId: firstImage.id,
            status: 'ready',
          },
        ],
      },
    )

    expect(result.images[0]?.upload).toEqual({
      fileId: 'file-1',
      status: 'ready',
    })
  })
})
