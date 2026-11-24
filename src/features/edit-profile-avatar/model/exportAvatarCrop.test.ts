import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_AVATAR_FILE_SIZE_BYTES, type AvatarCropSelection } from './avatarDraft'
import { AvatarExportError, exportAvatarCrop } from './exportAvatarCrop'

const mocks = vi.hoisted(() => ({
  bitmapClose: vi.fn(),
  createImageBitmap: vi.fn(),
  drawImage: vi.fn(),
  toBlob: vi.fn(),
}))

function createSelection(): AvatarCropSelection {
  return {
    height: 150.5,
    left: 12.5,
    source: new File(['source'], 'avatar.png', { type: 'image/png' }),
    top: 8.75,
    width: 150.5,
  }
}

describe('exportAvatarCrop', () => {
  beforeEach(() => {
    mocks.bitmapClose.mockReset()
    mocks.createImageBitmap.mockReset()
    mocks.drawImage.mockReset()
    mocks.toBlob.mockReset()
    mocks.createImageBitmap.mockResolvedValue({ close: mocks.bitmapClose })
    mocks.toBlob.mockImplementation((callback: BlobCallback) => {
      callback(new Blob(['exported'], { type: 'image/png' }))
    })
    vi.stubGlobal('createImageBitmap', mocks.createImageBitmap)
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => ({ drawImage: mocks.drawImage })),
        height: 0,
        toBlob: mocks.toBlob,
        width: 0,
      })),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports the selected square as a file with the source MIME type', async () => {
    const selection = createSelection()

    const file = await exportAvatarCrop(selection)

    expect(mocks.createImageBitmap).toHaveBeenCalledWith(selection.source)
    expect(mocks.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      12.5,
      8.75,
      150.5,
      150.5,
      0,
      0,
      151,
      151,
    )
    expect(mocks.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png')
    expect(file).toMatchObject({ name: 'avatar.png', type: 'image/png' })
    expect(mocks.bitmapClose).toHaveBeenCalledOnce()
  })

  it('rejects a failed canvas export and closes the bitmap', async () => {
    mocks.toBlob.mockImplementationOnce((callback: BlobCallback) => callback(null))

    await expect(exportAvatarCrop(createSelection())).rejects.toBeInstanceOf(AvatarExportError)
    expect(mocks.bitmapClose).toHaveBeenCalledOnce()
  })

  it('rejects an export larger than 10 MiB', async () => {
    mocks.toBlob.mockImplementationOnce((callback: BlobCallback) => {
      callback(new Blob([new Uint8Array(MAX_AVATAR_FILE_SIZE_BYTES + 1)], { type: 'image/png' }))
    })

    await expect(exportAvatarCrop(createSelection())).rejects.toThrow(
      'Avatar export exceeds the maximum file size.',
    )
  })
})
