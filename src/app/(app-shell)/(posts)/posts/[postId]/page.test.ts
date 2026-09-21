import { describe, expect, it } from 'vitest'

import * as postDetailsRoute from './page'

describe('Post details route config', () => {
  it('does not use Public Home ISR revalidation', () => {
    expect(postDetailsRoute).not.toHaveProperty('revalidate')
  })

  it('exports generateMetadata for the public post page', () => {
    expect(typeof postDetailsRoute.generateMetadata).toBe('function')
  })
})
