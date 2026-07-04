import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  query: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
    query: apolloMocks.query,
  },
}))

import {
  deletePost,
  feed,
  post,
  profilePosts,
  updatePostDescription,
  type DeletePostInput,
  type ProfilePostsInput,
  type UpdatePostDescriptionInput,
} from './postsApi'
import type { PostEntity } from '../model/backendTypes'

function getOperationDefinition(document: DocumentNode): OperationDefinitionNode {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition',
  )

  if (!operation) {
    throw new Error('Expected GraphQL operation definition.')
  }

  return operation
}

function getOperationName(document: DocumentNode): string | undefined {
  return getOperationDefinition(document).name?.value
}

function getVariableNames(document: DocumentNode): string[] {
  return (
    getOperationDefinition(document).variableDefinitions?.map((item) => item.variable.name.value) ??
    []
  )
}

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

describe('posts GraphQL helpers', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
    apolloMocks.query.mockReset()
  })

  it('loads feed posts', async () => {
    const payload = [createPostEntity()]

    apolloMocks.query.mockResolvedValueOnce({
      data: {
        feed: payload,
      },
    })

    await expect(feed()).resolves.toEqual(payload)

    const request = apolloMocks.query.mock.calls[0]?.[0]

    expect(getOperationName(request.query)).toBe('Feed')
    expect(getVariableNames(request.query)).toEqual([])
    expect(request.variables).toBeUndefined()
  })

  it('throws when feed returns no payload', async () => {
    apolloMocks.query.mockResolvedValueOnce({
      data: null,
    })

    await expect(feed()).rejects.toThrow('Feed loading failed. Please try again.')
  })

  it('propagates Apollo feed errors', async () => {
    const error = new Error('Apollo feed error')

    apolloMocks.query.mockRejectedValueOnce(error)

    await expect(feed()).rejects.toBe(error)
  })

  it('loads a post by id', async () => {
    const payload = createPostEntity()

    apolloMocks.query.mockResolvedValueOnce({
      data: {
        post: payload,
      },
    })

    await expect(post('post-1')).resolves.toEqual(payload)

    const request = apolloMocks.query.mock.calls[0]?.[0]

    expect(getOperationName(request.query)).toBe('Post')
    expect(getVariableNames(request.query)).toEqual(['id'])
    expect(request.variables).toEqual({ id: 'post-1' })
  })

  it('allows post query to return null', async () => {
    apolloMocks.query.mockResolvedValueOnce({
      data: {
        post: null,
      },
    })

    await expect(post('missing-post')).resolves.toBeNull()
  })

  it('throws when post returns no payload field', async () => {
    apolloMocks.query.mockResolvedValueOnce({
      data: {},
    })

    await expect(post('post-1')).rejects.toThrow('Post loading failed. Please try again.')
  })

  it('propagates Apollo post errors', async () => {
    const error = new Error('Apollo post error')

    apolloMocks.query.mockRejectedValueOnce(error)

    await expect(post('post-1')).rejects.toBe(error)
  })

  it('loads profile posts with cursor input', async () => {
    const input: ProfilePostsInput = {
      after: 'cursor-1',
      first: 8,
      userId: 'user-1',
    }
    const payload = {
      edges: [
        {
          cursor: 'cursor-2',
          node: createPostEntity(),
        },
      ],
      pageInfo: {
        endCursor: 'cursor-2',
        hasNextPage: false,
        startCursor: 'cursor-2',
      },
    }

    apolloMocks.query.mockResolvedValueOnce({
      data: {
        profilePosts: payload,
      },
    })

    await expect(profilePosts(input)).resolves.toEqual(payload)

    const request = apolloMocks.query.mock.calls[0]?.[0]

    expect(getOperationName(request.query)).toBe('ProfilePosts')
    expect(getVariableNames(request.query)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when profilePosts returns no payload', async () => {
    apolloMocks.query.mockResolvedValueOnce({
      data: null,
    })

    await expect(profilePosts({ userId: 'user-1' })).rejects.toThrow(
      'Profile posts loading failed. Please try again.',
    )
  })

  it('propagates Apollo profilePosts errors', async () => {
    const error = new Error('Apollo profile posts error')

    apolloMocks.query.mockRejectedValueOnce(error)

    await expect(profilePosts({ userId: 'user-1' })).rejects.toBe(error)
  })

  it('updates post description', async () => {
    const input: UpdatePostDescriptionInput = {
      description: 'Updated description',
      postId: 'post-1',
    }
    const payload = createPostEntity({ description: input.description })

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        updatePostDescription: payload,
      },
    })

    await expect(updatePostDescription(input)).resolves.toEqual(payload)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('UpdatePostDescription')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('throws when updatePostDescription returns no payload', async () => {
    const input: UpdatePostDescriptionInput = {
      description: 'Updated description',
      postId: 'post-1',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(updatePostDescription(input)).rejects.toThrow(
      'Post description update failed. Please try again.',
    )
  })

  it('propagates Apollo updatePostDescription errors', async () => {
    const error = new Error('Apollo update error')

    apolloMocks.mutate.mockRejectedValueOnce(error)

    await expect(
      updatePostDescription({
        description: 'Updated description',
        postId: 'post-1',
      }),
    ).rejects.toBe(error)
  })

  it('deletes a post', async () => {
    const input: DeletePostInput = {
      postId: 'post-1',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        deletePost: true,
      },
    })

    await expect(deletePost(input)).resolves.toBe(true)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('DeletePost')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
  })

  it('allows deletePost to return false', async () => {
    const input: DeletePostInput = {
      postId: 'post-1',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        deletePost: false,
      },
    })

    await expect(deletePost(input)).resolves.toBe(false)
  })

  it('throws when deletePost returns no payload', async () => {
    const input: DeletePostInput = {
      postId: 'post-1',
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(deletePost(input)).rejects.toThrow('Post deletion failed. Please try again.')
  })

  it('propagates Apollo deletePost errors', async () => {
    const error = new Error('Apollo delete error')

    apolloMocks.mutate.mockRejectedValueOnce(error)

    await expect(deletePost({ postId: 'post-1' })).rejects.toBe(error)
  })
})
