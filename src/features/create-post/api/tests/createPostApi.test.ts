import { afterEach, describe, expect, it, vi } from 'vitest'
import { visit, type DocumentNode, type OperationDefinitionNode } from 'graphql'

const apolloMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  apolloClient: {
    mutate: apolloMocks.mutate,
  },
}))

import { createPost, type CreatePostInput } from '../createPostApi'

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

function getFieldSelectionNames(document: DocumentNode, fieldName: string): string[] {
  let fieldNames: string[] = []

  visit(document, {
    Field(node) {
      if (node.name.value !== fieldName) {
        return
      }

      fieldNames =
        node.selectionSet?.selections.flatMap((selection) =>
          selection.kind === 'Field' ? [selection.name.value] : [],
        ) ?? []

      return false
    },
  })

  return fieldNames
}

describe('create post GraphQL helper', () => {
  afterEach(() => {
    apolloMocks.mutate.mockReset()
  })

  it('sends file ids and description through CreatePostInput', async () => {
    const input: CreatePostInput = {
      description: 'Post description',
      fileIds: ['file-1'],
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        createPost: {
          attachments: [
            {
              file: {
                id: 'file-1',
                mimeType: 'JPEG',
                originalName: 'post.jpg',
                ownerId: 'user-1',
                purpose: 'POST_IMAGE',
                size: 1024,
                status: 'READY',
                url: 'https://cdn.example/post.jpg',
              },
              fileId: 'file-1',
              sortOrder: 0,
            },
          ],
          author: {
            displayName: 'Backend Author',
            id: 'user-1',
            profilePictureFileId: null,
            username: 'backend_author',
          },
          createdAt: '2026-07-03T12:00:00.000Z',
          description: input.description,
          id: 'post-1',
          ownerId: 'user-1',
          updatedAt: '2026-07-03T12:00:00.000Z',
        },
      },
    })

    await expect(createPost(input)).resolves.toMatchObject({
      attachments: [
        {
          file: {
            url: 'https://cdn.example/post.jpg',
          },
        },
      ],
      id: 'post-1',
    })

    expect(apolloMocks.mutate).toHaveBeenCalledTimes(1)

    const request = apolloMocks.mutate.mock.calls[0]?.[0]

    expect(getOperationName(request.mutation)).toBe('CreatePost')
    expect(getVariableNames(request.mutation)).toEqual(['input'])
    expect(request.variables).toEqual({ input })
    expect(getFieldSelectionNames(request.mutation, 'attachments')).toEqual([
      'fileId',
      'sortOrder',
      'file',
    ])
    expect(getFieldSelectionNames(request.mutation, 'author')).toEqual([
      'id',
      'username',
      'displayName',
      'profilePictureFileId',
    ])
  })

  it('allows null description', async () => {
    const input: CreatePostInput = {
      description: null,
      fileIds: ['file-1'],
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: {
        createPost: {
          attachments: [],
          author: {
            displayName: null,
            id: 'user-1',
            profilePictureFileId: null,
            username: 'backend_author',
          },
          createdAt: '2026-07-03T12:00:00.000Z',
          description: null,
          id: 'post-1',
          ownerId: 'user-1',
          updatedAt: '2026-07-03T12:00:00.000Z',
        },
      },
    })

    await expect(createPost(input)).resolves.toMatchObject({
      description: null,
      id: 'post-1',
    })
  })

  it('rejects description longer than 500 characters before GraphQL request', async () => {
    await expect(
      createPost({
        description: 'a'.repeat(501),
        fileIds: ['file-1'],
      }),
    ).rejects.toThrow('Post description must be 500 characters or fewer.')

    expect(apolloMocks.mutate).not.toHaveBeenCalled()
  })

  it('throws when createPost returns no payload', async () => {
    const input: CreatePostInput = {
      fileIds: ['file-1'],
    }

    apolloMocks.mutate.mockResolvedValueOnce({
      data: null,
    })

    await expect(createPost(input)).rejects.toThrow('Post creation failed. Please try again.')
  })
})
