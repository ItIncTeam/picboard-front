import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { MAX_AVATAR_FILE_SIZE_BYTES } from '../../model/avatarDraft'
import { AvatarDraftPicker } from '../AvatarDraftPicker'

type CropCoordinates = { height: number; left: number; top: number; width: number }
type MockCropper = { getState: () => { coordinates: CropCoordinates } }
type CropperCallback = (cropper: MockCropper) => void

const cropperMocks = vi.hoisted(() => ({
  autoReady: true,
  callbacks: [] as Array<{ onError?: CropperCallback; onReady?: CropperCallback }>,
  coordinates: { height: 200, left: 10.5, top: 20.25, width: 200 } as CropCoordinates,
}))

vi.mock('react-advanced-cropper', async () => {
  const React = await import('react')

  return {
    Cropper: ({
      onChange,
      onError,
      onReady,
      src,
      stencilProps,
    }: {
      onChange?: CropperCallback
      onError?: CropperCallback
      onReady?: CropperCallback
      src: string
      stencilProps?: { aspectRatio?: number }
    }) => {
      const cropper = React.useMemo<MockCropper>(
        () => ({ getState: () => ({ coordinates: cropperMocks.coordinates }) }),
        [],
      )

      React.useEffect(() => {
        cropperMocks.callbacks.push({ onError, onReady })

        if (cropperMocks.autoReady) {
          onReady?.(cropper)
        }
      }, [cropper, onError, onReady])

      return (
        <button
          data-cropper-src={src}
          data-stencil-aspect-ratio={stencilProps?.aspectRatio}
          onClick={() => onChange?.(cropper)}
          type="button"
        >
          Change cropper
        </button>
      )
    },
  }
})

type RenderResult = { container: HTMLDivElement; root: Root }

const createObjectUrl = vi.fn()
const revokeObjectUrl = vi.fn()
const originalCreateObjectUrl = URL.createObjectURL
const originalRevokeObjectUrl = URL.revokeObjectURL

function createFile(name: string, type: string, size = 1): File {
  return new File([new ArrayBuffer(size)], name, { type })
}

async function renderPicker(): Promise<RenderResult> {
  const container = document.createElement('div')
  const root = createRoot(container)
  document.body.append(container)

  await act(async () => {
    root.render(
      <I18nProvider>
        <AvatarDraftPicker />
      </I18nProvider>,
    )
  })

  return { container, root }
}

async function selectFile(container: HTMLDivElement, file: File): Promise<void> {
  const input = container.querySelector('input[type="file"]')

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected file input.')
  }

  Object.defineProperty(input, 'files', { configurable: true, value: [file] })

  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function getButton(container: HTMLDivElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent === label,
  )

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected ${label} button.`)
  }

  return button
}

async function clickButton(container: HTMLDivElement, label: string): Promise<void> {
  await act(async () => {
    getButton(container, label).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('AvatarDraftPicker', () => {
  const renderedPickers: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    createObjectUrl.mockReset()
    revokeObjectUrl.mockReset()
    cropperMocks.autoReady = true
    cropperMocks.callbacks = []
    cropperMocks.coordinates = { height: 200, left: 10.5, top: 20.25, width: 200 }
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl })
  })

  afterEach(() => {
    renderedPickers.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    renderedPickers.length = 0
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectUrl,
    })
  })

  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.png', 'image/png'],
  ])('opens %s in a square cropper and saves its draft', async (name, type) => {
    createObjectUrl.mockReturnValueOnce(`blob:${name}`)
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile(name, type))

    expect(createObjectUrl).toHaveBeenCalledOnce()
    expect(view.container.querySelector('[data-cropper-src]')).toHaveAttribute(
      'data-cropper-src',
      `blob:${name}`,
    )
    expect(view.container.querySelector('[data-cropper-src]')).toHaveAttribute(
      'data-stencil-aspect-ratio',
      '1',
    )

    await clickButton(view.container, 'Save')

    expect(view.container.querySelector('img')).toHaveAttribute('src', `blob:${name}`)
  })

  it('does not create an object URL for an invalid first candidate', async () => {
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('photo.gif', 'image/gif'))

    expect(createObjectUrl).not.toHaveBeenCalled()
    expect(view.container.querySelector('img')).toBeNull()
    expect(view.container.querySelector('[role="alert"]')).toHaveTextContent(
      'Select a JPEG or PNG image.',
    )
  })

  it('keeps the hidden file input out of keyboard navigation', async () => {
    const view = await renderPicker()
    renderedPickers.push(view)

    expect(view.container.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1')
  })

  it('keeps Save disabled until the cropper is ready', async () => {
    cropperMocks.autoReady = false
    createObjectUrl.mockReturnValueOnce('blob:pending')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('pending.jpg', 'image/jpeg'))

    expect(getButton(view.container, 'Save')).toBeDisabled()

    await act(async () => {
      cropperMocks.callbacks[0]?.onReady?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    expect(getButton(view.container, 'Save')).toBeEnabled()
  })

  it('accepts a file exactly 10 MiB and rejects a larger file', async () => {
    createObjectUrl.mockReturnValueOnce('blob:allowed')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(
      view.container,
      createFile('allowed.jpg', 'image/jpeg', MAX_AVATAR_FILE_SIZE_BYTES),
    )
    await clickButton(view.container, 'Save')
    await selectFile(
      view.container,
      createFile('too-large.jpg', 'image/jpeg', MAX_AVATAR_FILE_SIZE_BYTES + 1),
    )

    expect(createObjectUrl).toHaveBeenCalledOnce()
    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:allowed')
    expect(view.container.querySelector('[role="alert"]')).toHaveTextContent(
      'The file must not exceed 10 MiB.',
    )
  })

  it('releases the first candidate when image decode fails', async () => {
    cropperMocks.autoReady = false
    createObjectUrl.mockReturnValueOnce('blob:broken')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('broken.jpg', 'image/jpeg'))

    await act(async () => {
      cropperMocks.callbacks[0]?.onError?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    expect(view.container.querySelector('img')).toBeNull()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:broken')
    expect(view.container.querySelector('[role="alert"]')).toHaveTextContent(
      'The selected image could not be read.',
    )
  })

  it('keeps the previous draft after an invalid replacement', async () => {
    createObjectUrl.mockReturnValueOnce('blob:previous')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('previous.jpg', 'image/jpeg'))
    await clickButton(view.container, 'Save')
    await selectFile(view.container, createFile('invalid.gif', 'image/gif'))

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:previous')
    expect(revokeObjectUrl).not.toHaveBeenCalled()
  })

  it('releases the previous URL only after a valid replacement is saved', async () => {
    createObjectUrl.mockReturnValueOnce('blob:previous').mockReturnValueOnce('blob:next')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('previous.jpg', 'image/jpeg'))
    await clickButton(view.container, 'Save')
    await selectFile(view.container, createFile('next.png', 'image/png'))

    expect(revokeObjectUrl).not.toHaveBeenCalled()

    await clickButton(view.container, 'Save')

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:next')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:previous')
  })

  it('releases a failed candidate and restores the previous valid draft', async () => {
    createObjectUrl.mockReturnValueOnce('blob:previous').mockReturnValueOnce('blob:broken')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('previous.jpg', 'image/jpeg'))
    await clickButton(view.container, 'Save')
    cropperMocks.autoReady = false
    await selectFile(view.container, createFile('broken.png', 'image/png'))

    await act(async () => {
      cropperMocks.callbacks[1]?.onError?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:previous')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:broken')
    expect(view.container.querySelector('[role="alert"]')).toHaveTextContent(
      'The selected image could not be read.',
    )
  })

  it('ignores callbacks from a replaced candidate', async () => {
    cropperMocks.autoReady = false
    createObjectUrl.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('first.jpg', 'image/jpeg'))
    await selectFile(view.container, createFile('second.png', 'image/png'))

    await act(async () => {
      cropperMocks.callbacks[0]?.onReady?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    await act(async () => {
      cropperMocks.callbacks[0]?.onError?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    expect(getButton(view.container, 'Save')).toBeDisabled()

    await act(async () => {
      cropperMocks.callbacks[1]?.onReady?.({
        getState: () => ({ coordinates: cropperMocks.coordinates }),
      })
    })

    expect(getButton(view.container, 'Save')).toBeEnabled()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:first')
  })

  it('releases the candidate URL on crop Cancel and the saved URL on draft Cancel', async () => {
    cropperMocks.autoReady = false
    createObjectUrl.mockReturnValueOnce('blob:cancelled').mockReturnValueOnce('blob:draft')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('cancelled.jpg', 'image/jpeg'))
    await clickButton(view.container, 'Cancel')

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:cancelled')

    cropperMocks.autoReady = true
    await selectFile(view.container, createFile('draft.jpg', 'image/jpeg'))
    await clickButton(view.container, 'Save')
    await clickButton(view.container, 'Cancel')

    expect(view.container.querySelector('img')).toBeNull()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:draft')
  })

  it('releases the active candidate URL on unmount', async () => {
    cropperMocks.autoReady = false
    createObjectUrl.mockReturnValueOnce('blob:unmounted')
    const view = await renderPicker()

    await selectFile(view.container, createFile('unmounted.jpg', 'image/jpeg'))
    act(() => view.root.unmount())
    view.container.remove()

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:unmounted')
  })
})
