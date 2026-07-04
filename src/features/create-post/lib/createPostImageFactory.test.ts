import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCreatePostImageFromFile } from './createPostImageFactory'

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
})
