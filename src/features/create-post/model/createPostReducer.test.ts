import { describe, expect, it } from 'vitest'

import { createPostInitialState, createPostReducer } from './createPostReducer'
import type { CreatePostState } from './createPostTypes'

describe('createPostReducer', () => {
  it('resets state to initial state', () => {
    const dirtyState: CreatePostState = {
      ...createPostInitialState,
      step: 'publication',
      caption: 'Test caption',
      hasUnsavedData: true,
      images: [
        {
          id: 'image-1',
          name: 'test.jpg',
          aspectRatio: '1:1',
          filter: 'normal',
        },
      ],
      activeImageId: 'image-1',
      isPublishing: true,
    }

    const result = createPostReducer(dirtyState, { type: 'reset' })

    expect(result).toEqual(createPostInitialState)
  })
})
it('moves to the next step', () => {
  expect(createPostReducer(createPostInitialState, { type: 'goNext' }).step).toBe('crop')

  expect(
    createPostReducer({ ...createPostInitialState, step: 'crop' }, { type: 'goNext' }).step,
  ).toBe('filters')

  expect(
    createPostReducer({ ...createPostInitialState, step: 'filters' }, { type: 'goNext' }).step,
  ).toBe('publication')

  expect(
    createPostReducer({ ...createPostInitialState, step: 'publication' }, { type: 'goNext' }).step,
  ).toBe('publication')
})

it('moves to the previous step', () => {
  expect(
    createPostReducer({ ...createPostInitialState, step: 'publication' }, { type: 'goBack' }).step,
  ).toBe('filters')

  expect(
    createPostReducer({ ...createPostInitialState, step: 'filters' }, { type: 'goBack' }).step,
  ).toBe('crop')

  expect(
    createPostReducer({ ...createPostInitialState, step: 'crop' }, { type: 'goBack' }).step,
  ).toBe('upload')

  expect(createPostReducer(createPostInitialState, { type: 'goBack' }).step).toBe('upload')
})
