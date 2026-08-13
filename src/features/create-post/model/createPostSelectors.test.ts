import { describe, expect, it } from 'vitest'

import {
  selectActiveImage,
  selectAreAllUploadsReady,
  selectCanGoNext,
  selectCanPublish,
  selectHasAllImagesExported,
  selectHasCreatePostUnsavedData,
  selectHasImages,
  selectImagesCount,
  selectIsReadyForUpload,
  selectReadyFileIds,
  selectUploadCandidates,
} from './createPostSelectors'
import { createPostInitialState } from './createPostReducer'
import type { CreatePostImage } from './createPostTypes'

function createImage(id = 'image-1', overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return {
    id,
    name: 'test.jpg',
    aspectRatio: '1:1',
    filter: 'normal',
    ...overrides,
  }
}

function createExportedImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return createImage('image-1', {
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

function getExportedImageData(image: CreatePostImage): NonNullable<CreatePostImage['exported']> {
  if (!image.exported) {
    throw new Error('Expected exported image data.')
  }

  return image.exported
}

describe('createPostSelectors', () => {
  it('returns 0 images count for empty state', () => {
    expect(selectImagesCount(createPostInitialState)).toBe(0)
  })

  it('returns images length', () => {
    expect(
      selectImagesCount({
        ...createPostInitialState,
        images: [createImage('image-1'), createImage('image-2')],
      }),
    ).toBe(2)
  })

  it('returns false for has images from empty state', () => {
    expect(selectHasImages(createPostInitialState)).toBe(false)
  })

  it('returns true for has images when images exist', () => {
    expect(
      selectHasImages({
        ...createPostInitialState,
        images: [createImage()],
      }),
    ).toBe(true)
  })

  it('returns null active image when activeImageId is null', () => {
    expect(
      selectActiveImage({
        ...createPostInitialState,
        images: [createImage()],
        activeImageId: null,
      }),
    ).toBeNull()
  })

  it('returns null active image when activeImageId is missing', () => {
    expect(
      selectActiveImage({
        ...createPostInitialState,
        images: [createImage('image-1')],
        activeImageId: 'missing-image',
      }),
    ).toBeNull()
  })

  it('returns active image when it exists', () => {
    const firstImage = createImage('image-1')
    const secondImage = createImage('image-2')

    expect(
      selectActiveImage({
        ...createPostInitialState,
        images: [firstImage, secondImage],
        activeImageId: secondImage.id,
      }),
    ).toBe(secondImage)
  })

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

  it('returns false for all images exported when there are no images', () => {
    expect(selectHasAllImagesExported(createPostInitialState)).toBe(false)
  })

  it('returns false for all images exported when at least one image has no exported file', () => {
    expect(
      selectHasAllImagesExported({
        ...createPostInitialState,
        images: [createExportedImage(), createImage('image-2')],
      }),
    ).toBe(false)
  })

  it('returns true when all images have exported file', () => {
    expect(
      selectHasAllImagesExported({
        ...createPostInitialState,
        images: [createExportedImage(), createExportedImage({ id: 'image-2' })],
      }),
    ).toBe(true)
  })

  it('keeps ready for upload selector as exported readiness alias', () => {
    const state = {
      ...createPostInitialState,
      images: [createExportedImage()],
    }

    expect(selectIsReadyForUpload(state)).toBe(selectHasAllImagesExported(state))
  })

  it('returns empty upload candidates array when no exported images exist', () => {
    expect(
      selectUploadCandidates({
        ...createPostInitialState,
        images: [createImage()],
      }),
    ).toEqual([])
  })

  it('returns only exported images as upload candidates', () => {
    const firstImage = createExportedImage({ id: 'image-1' })
    const secondImage = createImage('image-2')

    expect(
      selectUploadCandidates({
        ...createPostInitialState,
        images: [firstImage, secondImage],
      }),
    ).toHaveLength(1)
  })

  it('returns image id, exported file and exported file info for upload candidates', () => {
    const image = createExportedImage({ id: 'image-1' })
    const exported = getExportedImageData(image)

    expect(
      selectUploadCandidates({
        ...createPostInitialState,
        images: [image],
      }),
    ).toEqual([
      {
        exportedFile: exported.file,
        exportedFileInfo: exported.fileInfo,
        imageId: image.id,
      },
    ])
  })

  it('uses only final exported artifact when cropped base differs', () => {
    const croppedFile = new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' })
    const finalFile = new File(['filtered'], 'filtered.jpg', { type: 'image/jpeg' })
    const image = createExportedImage({
      cropped: {
        file: croppedFile,
        fileInfo: {
          lastModified: croppedFile.lastModified,
          name: croppedFile.name,
          size: croppedFile.size,
          type: croppedFile.type,
        },
        objectUrl: 'blob:cropped',
      },
      exported: {
        file: finalFile,
        fileInfo: {
          lastModified: finalFile.lastModified,
          name: finalFile.name,
          size: finalFile.size,
          type: finalFile.type,
        },
        objectUrl: 'blob:filtered',
      },
      filter: 'moon',
    })

    expect(
      selectUploadCandidates({ ...createPostInitialState, images: [image] })[0]?.exportedFile,
    ).toBe(finalFile)
  })

  it('preserves image order for upload candidates', () => {
    const firstImage = createExportedImage({ id: 'image-1' })
    const secondImage = createExportedImage({ id: 'image-2' })

    expect(
      selectUploadCandidates({
        ...createPostInitialState,
        images: [firstImage, secondImage],
      }).map((candidate) => candidate.imageId),
    ).toEqual(['image-1', 'image-2'])
  })

  it('returns empty file ids when no uploads are ready', () => {
    expect(
      selectReadyFileIds({
        ...createPostInitialState,
        images: [
          createImage('image-1', {
            upload: {
              fileId: 'file-1',
              status: 'uploaded',
            },
          }),
        ],
      }),
    ).toEqual([])
  })

  it('returns file ids for ready uploads only', () => {
    expect(
      selectReadyFileIds({
        ...createPostInitialState,
        images: [
          createImage('image-1', {
            upload: {
              fileId: 'file-1',
              status: 'ready',
            },
          }),
          createImage('image-2', {
            upload: {
              fileId: 'file-2',
              status: 'uploaded',
            },
          }),
        ],
      }),
    ).toEqual(['file-1'])
  })

  it('preserves image order for ready file ids', () => {
    expect(
      selectReadyFileIds({
        ...createPostInitialState,
        images: [
          createImage('image-2', {
            upload: {
              fileId: 'file-2',
              status: 'ready',
            },
          }),
          createImage('image-1', {
            upload: {
              fileId: 'file-1',
              status: 'ready',
            },
          }),
        ],
      }),
    ).toEqual(['file-2', 'file-1'])
  })

  it('returns false for all uploads ready when there are no images', () => {
    expect(selectAreAllUploadsReady(createPostInitialState)).toBe(false)
  })

  it('returns false for all uploads ready when upload is missing', () => {
    expect(
      selectAreAllUploadsReady({
        ...createPostInitialState,
        images: [createImage()],
      }),
    ).toBe(false)
  })

  it('returns false for all uploads ready when status is uploaded but not ready', () => {
    expect(
      selectAreAllUploadsReady({
        ...createPostInitialState,
        images: [
          createImage('image-1', {
            upload: {
              fileId: 'file-1',
              status: 'uploaded',
            },
          }),
        ],
      }),
    ).toBe(false)
  })

  it('returns false for all uploads ready when ready status has no file id', () => {
    expect(
      selectAreAllUploadsReady({
        ...createPostInitialState,
        images: [
          createImage('image-1', {
            upload: {
              status: 'ready',
            },
          }),
        ],
      }),
    ).toBe(false)
  })

  it('returns true when all images are ready and have file id', () => {
    expect(
      selectAreAllUploadsReady({
        ...createPostInitialState,
        images: [
          createImage('image-1', {
            upload: {
              fileId: 'file-1',
              status: 'ready',
            },
          }),
          createImage('image-2', {
            upload: {
              fileId: 'file-2',
              status: 'ready',
            },
          }),
        ],
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

  it('returns false for publish from publication when caption length is greater than 500', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
        caption: 'a'.repeat(501),
        images: [createExportedImage()],
      }),
    ).toBe(false)
  })

  it('returns false for publish from publication while publishing', () => {
    expect(
      selectCanPublish({
        ...createPostInitialState,
        step: 'publication',
        images: [createExportedImage()],
        isPublishing: true,
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
