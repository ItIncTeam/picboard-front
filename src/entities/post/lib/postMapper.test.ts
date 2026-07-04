import { describe, expect, it } from 'vitest'

import type { PostEntity } from '../model/backendTypes'
import { mapPostEntitiesToPosts, mapPostEntityToPost } from './postMapper'

function createPostEntity(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: 'file-1',
          mimeType: 'JPEG',
          originalName: 'first.jpg',
          ownerId: 'user-1',
          purpose: 'POST_IMAGE',
          size: 1024,
          status: 'READY',
          url: 'https://cdn.example/first.jpg',
        },
        fileId: 'file-1',
        sortOrder: 1,
      },
      {
        file: {
          id: 'file-2',
          mimeType: 'PNG',
          originalName: 'cover.png',
          ownerId: 'user-1',
          purpose: 'POST_IMAGE',
          size: 2048,
          status: 'READY',
          url: 'https://cdn.example/cover.png',
        },
        fileId: 'file-2',
        sortOrder: 0,
      },
    ],
    createdAt: '2026-07-04T12:00:00.000Z',
    description: 'Post description',
    id: 'post-1',
    ownerId: 'user-1',
    updatedAt: '2026-07-04T12:10:00.000Z',
    ...overrides,
  }
}

describe('post mapper', () => {
  it('maps backend PostEntity to frontend Post display model', () => {
    expect(mapPostEntityToPost(createPostEntity())).toEqual({
      authorName: 'user-1',
      caption: 'Post description',
      createdAtLabel: '2026-07-04T12:00:00.000Z',
      id: 'post-1',
      images: [
        {
          alt: 'cover.png',
          id: 'file-2',
          url: 'https://cdn.example/cover.png',
        },
        {
          alt: 'first.jpg',
          id: 'file-1',
          url: 'https://cdn.example/first.jpg',
        },
      ],
    })
  })

  it('maps backend entities list to frontend posts', () => {
    expect(mapPostEntitiesToPosts([createPostEntity({ id: 'post-1' })])).toHaveLength(1)
  })
})
