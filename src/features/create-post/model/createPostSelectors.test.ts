import { describe, expect, it } from 'vitest'

import {
  selectCanGoNext,
  selectCanPublish,
  selectHasCreatePostUnsavedData,
  selectIsReadyForUpload,
} from './createPostSelectors'
import { createPostInitialState } from './createPostReducer'
import type { CreatePostImage } from './createPostTypes'

function createImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return {
    id: 'image-1',
    name: 'test.jpg',
    aspectRatio: '1:1',
    filter: 'normal',
    ...overrides,
  }
}

function createExportedImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return createImage({
    exported: {
      file: new File(['edited'], 'edited.jpg', {
        type: 'image/jpeg',
      }),
      objectUrl: 'blob:test',
      fileInfo: {
        name: 'edited.jpg',
        size: 6,
        type: 'image/jpeg',
        lastModified: Date.now(),
      },
    },
    ...overrides,
  })
}

describe('createPostSelectors', () => {
  it('detects unsaved data', () => {
    expect(selectHasCreatePostUnsavedData(createPostInitialState)).toBe(false)

    expect(
      selectHasCreatePostUnsavedData({
        ...createPostInitialState,
        caption: 'Test caption',
      }),
    ).toBe(true)

    expect(
      selectHasCreatePostUnsavedData({
        ...createPostInitialState,
        hasUnsavedData: true,
      }),
    ).toBe(true)
  })

  it('returns false when images are not exported', () => {
    expect(selectIsReadyForUpload(createPostInitialState)).toBe(false)

    expect(
      selectIsReadyForUpload({
        ...createPostInitialState,
        images: [createImage()],
      }),
    ).toBe(false)
  })

  it('returns true when all images are exported', () => {
    expect(
      selectIsReadyForUpload({
        ...createPostInitialState,
        images: [createExportedImage()],
      }),
    ).toBe(true)
  })

  it('returns false for next from upload when there are no images', () => {
    expect(selectCanGoNext(createPostInitialState)).toBe(false)
  })

  it('returns true for next from upload when there are images', () => {
    expect(
      selectCanGoNext({
        ...createPostInitialState,
        images: [createImage()],
      }),
    ).toBe(true)
  })

  it('returns true for next from crop when there are images', () => {
    expect(
      selectCanGoNext({
        ...createPostInitialState,
        step: 'crop',
        images: [createImage()],
      }),
    ).toBe(true)
  })

  it('returns true for next from filters when there are images', () => {
    expect(
      selectCanGoNext({
        ...createPostInitialState,
        step: 'filters',
        images: [createImage()],
      }),
    ).toBe(true)
  })

  it('returns false for next from publication when there are images', () => {
    expect(
      selectCanGoNext({
        ...createPostInitialState,
        step: 'publication',
        images: [createImage()],
      }),
    ).toBe(false)
  })

  it('returns false for publish from upload when image is exported', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        images: [createExportedImage()],
      }),
    ).toBe(false)
  })

  it('returns false for publish from publication when there are no images', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
      }),
    ).toBe(false)
  })

  it('returns false for publish from publication when image is not exported', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
        images: [createImage()],
      }),
    ).toBe(false)
  })

  it('returns true for publish from publication when all images are exported', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
        images: [createExportedImage()],
      }),
    ).toBe(true)
  })

  it('returns true for publish from publication when image is exported and caption is empty', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
        caption: '',
        images: [createExportedImage()],
      }),
    ).toBe(true)
  })
})
