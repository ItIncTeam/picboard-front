import type { Post } from '../model/postTypes'

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

export function createMockPost(index: number): Post {
  const postNumber = index + 1

  return {
    id: `post-${postNumber}`,
    authorName: 'URLProfile',
    caption: `Publication ${postNumber}`,
    images: [
      {
        id: `image-${postNumber}`,
        alt: '',
        url: mockImageUrls[index % mockImageUrls.length] ?? mockImageUrls[0],
      },
    ],
  }
}

export function createMockPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, index) => {
    return createMockPost(index)
  })
}
