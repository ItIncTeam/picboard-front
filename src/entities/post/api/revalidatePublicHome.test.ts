import { describe, expect, it, vi } from 'vitest'

import { revalidatePublicHome } from './revalidatePublicHome'

const nextCacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: nextCacheMocks.revalidatePath,
}))

describe('revalidatePublicHome', () => {
  it('revalidates only the fixed Public Home path', async () => {
    await revalidatePublicHome()

    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledOnce()
    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/')
  })
})
