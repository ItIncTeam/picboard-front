import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as PostEntityModule from '@/entities/post'

const postApiMocks = vi.hoisted(() => ({
  getPublicHomeQueryData: vi.fn(),
}))

vi.mock('@/entities/post', async (importOriginal) => {
  const originalModule = await importOriginal<typeof PostEntityModule>()

  return {
    ...originalModule,
    getPublicHomeQueryData: postApiMocks.getPublicHomeQueryData,
  }
})

import { getPublicHomeData } from './getPublicHomeData'

describe('getPublicHomeData', () => {
  afterEach(() => {
    postApiMocks.getPublicHomeQueryData.mockReset()
  })

  it('propagates a gateway failure to the route error boundary', async () => {
    postApiMocks.getPublicHomeQueryData.mockRejectedValueOnce(new Error('Gateway error'))

    await expect(getPublicHomeData()).rejects.toThrow('Gateway error')
  })

  it('keeps a successful empty feed distinct from an error', async () => {
    postApiMocks.getPublicHomeQueryData.mockResolvedValueOnce({
      feed: [],
      usersCount: 0,
    })

    await expect(getPublicHomeData()).resolves.toEqual({
      posts: [],
      usersCount: 0,
    })
  })
})
