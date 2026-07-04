import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCreatePostImageFromFile, createCreatePostImageId } from './createPostImageFactory'

describe('create post image factory', () => {
  const originalCreateObjectUrl = URL.createObjectURL

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl
    vi.unstubAllGlobals()
  })

  it('uses crypto.randomUUID as CreatePostImage.id', () => {
    const randomUUID = vi.fn(() => 'uuid-image-1')
    const file = new File(['image'], 'post.jpg', {
      type: 'image/jpeg',
      lastModified: 1,
    })

    vi.stubGlobal('crypto', {
      randomUUID,
    })
    URL.createObjectURL = vi.fn(() => 'blob:post')

    expect(createCreatePostImageFromFile(file)).toMatchObject({
      id: 'uuid-image-1',
      name: 'post.jpg',
      file,
      fileInfo: {
        name: 'post.jpg',
        size: file.size,
        type: 'image/jpeg',
        lastModified: 1,
      },
      previewUrl: 'blob:post',
      aspectRatio: 'original',
      filter: 'normal',
    })
    expect(randomUUID).toHaveBeenCalledTimes(1)
  })

  it('uses UUID-like fallback when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.forEach((_, index) => {
          bytes[index] = index
        })

        return bytes
      },
    })

    expect(createCreatePostImageId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })
})
