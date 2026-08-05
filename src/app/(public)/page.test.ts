import { describe, expect, it } from 'vitest'

import * as publicHomeRoute from './page'

describe('Public Home route config', () => {
  it('renders at request time while the gateway is unstable', () => {
    expect(publicHomeRoute.dynamic).toBe('force-dynamic')
    expect(publicHomeRoute).not.toHaveProperty('revalidate')
  })
})
