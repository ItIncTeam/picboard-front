import type { CreatePostImage } from '../model/createPostTypes'

const createPostImageIdFallbackPrefix = 'create-post-image'

export function createCreatePostImageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${createPostImageIdFallbackPrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createCreatePostImageFromFile(file: File): CreatePostImage {
  return {
    id: createCreatePostImageId(),
    name: file.name,
    file,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
    previewUrl: URL.createObjectURL(file),
    aspectRatio: 'original',
    filter: 'normal',
  }
}
