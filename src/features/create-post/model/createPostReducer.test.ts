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
})
