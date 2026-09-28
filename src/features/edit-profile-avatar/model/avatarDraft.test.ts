import { describe, expect, it } from 'vitest'

import { createAvatarCropSelection } from './avatarDraft'

describe('createAvatarCropSelection', () => {
  it('preserves fractional orientation-normalized coordinates and uses square geometry', () => {
    const source = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

    const selection = createAvatarCropSelection(source, {
      height: 151.25,
      left: 12.5,
      top: 8.75,
      width: 150.5,
    })

    expect(selection).toEqual({
      height: 150.5,
      left: 12.5,
      source,
      top: 8.75,
      width: 150.5,
    })
  })
})
