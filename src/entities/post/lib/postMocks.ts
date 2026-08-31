import type { Post } from '@/entities/post'

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

const longCaption =
  'A very long publication caption that should wrap across multiple lines in Storybook previews. ' +
  'It helps verify text overflow behavior without affecting the profile grid thumbnail layout.'

export function createMockPost(index: number): Post {
  const postNumber = index + 1

  return {
    author: {
      displayName: 'URL Profile',
      id: 'storybook-user',
      profilePictureFileId: null,
      username: 'url_profile',
    },
    id: `post-${postNumber}`,
    caption: `Publication ${postNumber}`,
    images: [
      {
        id: `image-${postNumber}`,
        alt: '',
        url: mockImageUrls[index % mockImageUrls.length] ?? mockImageUrls[0],
      },
    ],
    ownerId: 'storybook-user',
  }
}

export function createMockPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, index) => {
    return createMockPost(index)
  })
}

export function createMockPostWithMultipleImages(imageCount = 3): Post {
  return {
    author: {
      displayName: 'URL Profile',
      id: 'storybook-user',
      profilePictureFileId: null,
      username: 'url_profile',
    },
    id: 'post-multi-image',
    caption: 'Post with multiple images',
    images: Array.from({ length: imageCount }, (_, index) => {
      const imageNumber = index + 1

      return {
        id: `image-${imageNumber}`,
        alt: '',
        url: mockImageUrls[index % mockImageUrls.length] ?? mockImageUrls[0],
      }
    }),
    ownerId: 'storybook-user',
  }
}

export function createMockPostWithLongCaption(): Post {
  return {
    ...createMockPost(0),
    id: 'post-long-caption',
    caption: longCaption,
  }
}

export const mockSinglePost = createMockPost(0)
export const mockMultiImagePost = createMockPostWithMultipleImages(3)
export const mockLongCaptionPost = createMockPostWithLongCaption()
