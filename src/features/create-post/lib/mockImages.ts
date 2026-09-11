import type { CreatePostImage } from '@/features/create-post'

const mockImageUrls = [
  'https://picsum.photos/seed/post-1/640/640',
  'https://picsum.photos/seed/post-2/640/640',
  'https://picsum.photos/seed/post-3/640/640',
  'https://picsum.photos/seed/post-4/640/640',
  'https://picsum.photos/seed/post-5/640/640',
  'https://picsum.photos/seed/post-6/640/640',
  'https://picsum.photos/seed/post-7/640/640',
  'https://picsum.photos/seed/post-8/640/640',
]

const mockFileInfo = {
  name: 'mock-image.jpg',
  size: 120_000,
  type: 'image/jpeg',
  lastModified: 1_700_000_000_000,
}

export function createMockImage(index: number): CreatePostImage {
  const imageNumber = index + 1

  return {
    id: `image-${imageNumber}`,
    name: `${imageNumber}.jpg`,
    fileInfo: mockFileInfo,
    previewUrl: mockImageUrls[index % mockImageUrls.length] ?? mockImageUrls[0],
    aspectRatio: 'original',
    filter: 'normal',
  }
}

export function createMockImages(count: number): CreatePostImage[] {
  return Array.from({ length: count }, (_, index) => {
    return createMockImage(index)
  })
}
