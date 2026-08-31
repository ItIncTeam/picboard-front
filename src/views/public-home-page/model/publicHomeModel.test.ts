import { describe, expect, it } from 'vitest'

import type { PostEntity } from '@/entities/post'
import { createPublicHomeDisplayModel } from './publicHomeModel'

function createPost(id: string, overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [
      {
        file: {
          id: `${id}-file-2`,
          mimeType: 'JPEG',
          originalName: `${id}-second.jpg`,
          ownerId: `owner-${id}`,
          purpose: 'POST_IMAGE',
          size: 200,
          status: 'READY',
          url: `https://example.com/${id}-second.jpg`,
        },
        fileId: `${id}-file-2`,
        sortOrder: 2,
      },
      {
        file: null,
        fileId: `${id}-missing-file`,
        sortOrder: 1,
      },
      {
        file: {
          id: `${id}-file-1`,
          mimeType: 'PNG',
          originalName: `${id}-first.png`,
          ownerId: `owner-${id}`,
          purpose: 'POST_IMAGE',
          size: 100,
          status: 'READY',
          url: `https://example.com/${id}-first.png`,
        },
        fileId: `${id}-file-1`,
        sortOrder: 0,
      },
    ],
    author: {
      displayName: '  Public Author  ',
      id: `owner-${id}`,
      profilePictureFileId: 'avatar-file-id',
      username: `author_${id}`,
    },
    createdAt: '2026-08-05T10:00:00.000Z',
    description: `Description ${id}`,
    id,
    ownerId: `technical-owner-${id}`,
    updatedAt: '2026-08-05T10:00:00.000Z',
    ...overrides,
  }
}

describe('Public Home display model', () => {
  it('preserves the backend feed order', () => {
    const model = createPublicHomeDisplayModel({
      feed: Array.from({ length: 4 }, (_, index) => createPost(`post-${index + 1}`)),
      usersCount: 25,
    })

    expect(model.posts.map((post) => post.id)).toEqual(['post-1', 'post-2', 'post-3', 'post-4'])
    expect(model.usersCount).toBe(25)
  })

  it('keeps every usable media item in sortOrder and maps the backend author', () => {
    const model = createPublicHomeDisplayModel({
      feed: [createPost('post-1')],
      usersCount: 1,
    })

    expect(model.posts[0]).toMatchObject({
      author: {
        displayName: '  Public Author  ',
        id: 'owner-post-1',
        profilePictureFileId: 'avatar-file-id',
        username: 'author_post-1',
      },
      media: [
        {
          id: 'post-1-file-1',
          url: 'https://example.com/post-1-first.png',
        },
        {
          id: 'post-1-file-2',
          url: 'https://example.com/post-1-second.jpg',
        },
      ],
    })
    expect(model.posts[0]?.author.username).not.toContain('technical-owner')
  })
})
