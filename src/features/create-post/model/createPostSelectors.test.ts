import { describe, expect, it } from 'vitest'

import { selectHasCreatePostUnsavedData, selectIsReadyForUpload } from './createPostSelectors'
import { createPostInitialState } from './createPostReducer'

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
        images: [
          {
            id: 'image-1',
            name: 'test.jpg',
            aspectRatio: '1:1',
            filter: 'normal',
          },
        ],
      }),
    ).toBe(false)
  })

  it('returns true when all images are exported', () => {
    expect(
      selectIsReadyForUpload({
        ...createPostInitialState,
        images: [
          {
            id: 'image-1',
            name: 'test.jpg',
            aspectRatio: '1:1',
            filter: 'normal',
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
          },
        ],
      }),
    ).toBe(true)
  })
})
