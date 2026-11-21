import { describe, expect, it } from 'vitest'

import type { PostEntity } from '../model/backendTypes'
import {
  isConsistentFeedAuthorError,
  isConsistentPostAuthorError,
  isConsistentProfilePostsAuthorError,
  isFeedAuthorErrorPath,
  isPostAuthorErrorPath,
  isProfilePostsAuthorErrorPath,
} from './graphqlAuthorErrors'

function createPost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [],
    author: {
      avatar: null,
      displayName: 'Author',
      id: 'user-1',
      profilePictureFileId: null,
      username: 'author',
    },
    createdAt: '2026-07-04T12:00:00.000Z',
    description: null,
    id: 'post-1',
    ownerId: 'user-1',
    updatedAt: '2026-07-04T12:00:00.000Z',
    ...overrides,
  }
}

describe('graphqlAuthorErrors', () => {
  it.each([
    ['post', 'author'],
    ['post', 'author', 'username'],
    ['post', 'author', 'avatar', 'url'],
  ])('accepts post author paths: %j', (...path) => {
    expect(isPostAuthorErrorPath(path)).toBe(true)
  })

  it.each([
    { path: undefined },
    { path: [] as Array<string | number> },
    { path: ['post'] },
    { path: ['post', 'description'] },
    { path: ['feed', 0, 'author'] },
  ])('rejects unrelated post paths: $path', ({ path }) => {
    expect(isPostAuthorErrorPath(path)).toBe(false)
  })

  it('accepts in-range feed author paths and rejects foreign indexes', () => {
    expect(isFeedAuthorErrorPath(['feed', 0, 'author'], 2)).toBe(true)
    expect(isFeedAuthorErrorPath(['feed', 1, 'author', 'avatar', 'url'], 2)).toBe(true)
    expect(isFeedAuthorErrorPath(['feed', 2, 'author'], 2)).toBe(false)
    expect(isFeedAuthorErrorPath(['feed', '0', 'author'], 1)).toBe(false)
  })

  it('accepts in-range profilePosts author paths and rejects foreign indexes', () => {
    expect(isProfilePostsAuthorErrorPath(['profilePosts', 'edges', 0, 'node', 'author'], 1)).toBe(
      true,
    )
    expect(
      isProfilePostsAuthorErrorPath(
        ['profilePosts', 'edges', 0, 'node', 'author', 'avatar', 'url'],
        1,
      ),
    ).toBe(true)
    expect(isProfilePostsAuthorErrorPath(['profilePosts', 'edges', 4, 'node', 'author'], 1)).toBe(
      false,
    )
    expect(isProfilePostsAuthorErrorPath(['profilePosts', 'edges', '0', 'node', 'author'], 1)).toBe(
      false,
    )
  })

  it('requires author null for author-level errors and avatar null for avatar errors', () => {
    const withAuthor = createPost({
      author: {
        avatar: {
          id: 'avatar-1',
          url: 'https://cdn.example/avatar.jpg',
        },
        displayName: 'Author',
        id: 'user-1',
        profilePictureFileId: 'avatar-1',
        username: 'author',
      },
    })
    const withoutAuthor = createPost({ author: null })
    const withoutAvatar = createPost({
      author: {
        avatar: null,
        displayName: 'Author',
        id: 'user-1',
        profilePictureFileId: null,
        username: 'author',
      },
    })

    expect(isConsistentPostAuthorError(['post', 'author'], withoutAuthor)).toBe(true)
    expect(isConsistentPostAuthorError(['post', 'author'], withAuthor)).toBe(false)
    expect(isConsistentPostAuthorError(['post', 'author', 'avatar', 'url'], withoutAvatar)).toBe(
      true,
    )
    expect(isConsistentPostAuthorError(['post', 'author', 'avatar', 'url'], withAuthor)).toBe(false)

    expect(isConsistentFeedAuthorError(['feed', 0, 'author'], [withoutAuthor])).toBe(true)
    expect(isConsistentFeedAuthorError(['feed', 0, 'author'], [withAuthor])).toBe(false)

    const connection = {
      edges: [{ cursor: 'c1', node: withoutAuthor }],
      pageInfo: { endCursor: 'c1', hasNextPage: false, startCursor: 'c1' },
    }
    expect(
      isConsistentProfilePostsAuthorError(
        ['profilePosts', 'edges', 0, 'node', 'author'],
        connection,
      ),
    ).toBe(true)
    expect(
      isConsistentProfilePostsAuthorError(['profilePosts', 'edges', 0, 'node', 'author'], {
        ...connection,
        edges: [{ cursor: 'c1', node: withAuthor }],
      }),
    ).toBe(false)
  })
})
