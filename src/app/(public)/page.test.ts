import { describe, expect, it } from 'vitest'

import * as publicHomeRoute from './page'

describe('Public Home route config', () => {
  it('revalidates the public route every 60 seconds', () => {
    expect(publicHomeRoute.revalidate).toBe(60)
    expect(publicHomeRoute).not.toHaveProperty('dynamic')
  })
})
