import { describe, expect, it } from 'vitest'

import {
  isFeedAuthorErrorPath,
  isPostAuthorErrorPath,
  isProfilePostsAuthorErrorPath,
} from './graphqlAuthorErrors'

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
})
