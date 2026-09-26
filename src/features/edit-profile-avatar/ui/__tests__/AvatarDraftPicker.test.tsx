import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { MAX_AVATAR_FILE_SIZE_BYTES } from '../../model/avatarDraft'
import { AvatarDraftPicker } from '../AvatarDraftPicker'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

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

describe('AvatarDraftPicker', () => {
  const renderedPickers: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    createObjectUrl.mockReset()
    revokeObjectUrl.mockReset()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    })
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
  ])('creates a preview for %s', async (name, type) => {
    createObjectUrl.mockReturnValueOnce(`blob:${name}`)
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile(name, type))

    expect(createObjectUrl).toHaveBeenCalledOnce()
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

  it('accepts a file exactly 10 MiB and rejects a larger file', async () => {
    createObjectUrl.mockReturnValueOnce('blob:allowed')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(
      view.container,
      createFile('allowed.jpg', 'image/jpeg', MAX_AVATAR_FILE_SIZE_BYTES),
    )

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:allowed')

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

  it('keeps the previous draft after an invalid replacement', async () => {
    createObjectUrl.mockReturnValueOnce('blob:previous')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('previous.jpg', 'image/jpeg'))
    await selectFile(view.container, createFile('invalid.gif', 'image/gif'))

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:previous')
    expect(revokeObjectUrl).not.toHaveBeenCalled()
  })

  it('releases the previous URL after a valid replacement', async () => {
    createObjectUrl.mockReturnValueOnce('blob:previous').mockReturnValueOnce('blob:next')
    const view = await renderPicker()
    renderedPickers.push(view)

    await selectFile(view.container, createFile('previous.jpg', 'image/jpeg'))
    await selectFile(view.container, createFile('next.png', 'image/png'))

    expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:next')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:previous')
  })

  it('releases the active URL on Cancel and unmount', async () => {
    createObjectUrl.mockReturnValueOnce('blob:cancelled').mockReturnValueOnce('blob:unmounted')
    const view = await renderPicker()

    await selectFile(view.container, createFile('cancelled.jpg', 'image/jpeg'))
    const cancelButton = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Cancel',
    )

    await act(async () => {
      cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(view.container.querySelector('img')).toBeNull()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:cancelled')

    await selectFile(view.container, createFile('unmounted.jpg', 'image/jpeg'))
    act(() => view.root.unmount())
    view.container.remove()

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:unmounted')
  })
})
