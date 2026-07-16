import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatePostImage } from '@/features/create-post'

import { FiltersStep } from '../FiltersStep'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const createImageBitmapMock = vi.fn()
const createObjectUrlMock = vi.fn()
const closeImageBitmapMock = vi.fn()
const drawImageMock = vi.fn()

function createImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  const file = new File(['original'], 'original.jpg', { type: 'image/jpeg' })

  return {
    aspectRatio: '1:1',
    file,
    filter: 'normal',
    id: 'image-1',
    name: file.name,
    previewUrl: 'blob:original-preview',
    ...overrides,
  }
}

function createExported(fileName = 'cropped.jpg'): NonNullable<CreatePostImage['exported']> {
  const file = new File(['cropped'], fileName, { type: 'image/jpeg' })

  return {
    file,
    fileInfo: {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
    },
    objectUrl: `blob:${fileName}`,
  }
}

function renderFiltersStep({
  activeImage,
  onFilterBaseChange = vi.fn(),
  onFilterChange = vi.fn(),
  onFilterExportingChange = vi.fn(),
  onImageExported = vi.fn(),
}: {
  activeImage: CreatePostImage | null
  onFilterBaseChange?: (imageId: string, filterBase: CreatePostImage['filterBase']) => void
  onFilterChange?: (imageId: string, filter: CreatePostImage['filter']) => void
  onFilterExportingChange?: (imageId: string, isExporting: boolean) => void
  onImageExported?: (imageId: string, exported: CreatePostImage['exported']) => void
}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <FiltersStep
        activeImage={activeImage}
        onFilterBaseChange={onFilterBaseChange}
        onFilterChange={onFilterChange}
        onFilterExportingChange={onFilterExportingChange}
        onImageExported={onImageExported}
      />,
    )
  })

  return { container, root }
}

function getButton(container: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((item) => {
    return item.textContent === name
  })

  if (!button) {
    throw new Error(`Expected button "${name}".`)
  }

  return button
}

async function clickButton(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('FiltersStep', () => {
  const mountedRoots: RenderResult[] = []
  let restoreCreateElement = () => {}

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    closeImageBitmapMock.mockReset()
    createImageBitmapMock.mockResolvedValue({
      close: closeImageBitmapMock,
      height: 80,
      width: 120,
    })
    createObjectUrlMock.mockReturnValue('blob:filtered-output')
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectUrlMock,
    })

    const originalCreateElement = document.createElement.bind(document)

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)

      if (tagName === 'canvas') {
        Object.defineProperty(element, 'getContext', {
          configurable: true,
          value: () => ({
            drawImage: drawImageMock,
            filter: '',
          }),
        })
        Object.defineProperty(element, 'toBlob', {
          configurable: true,
          value: (callback: BlobCallback, type?: string) => {
            callback(new Blob(['filtered'], { type }))
          },
        })
      }

      return element
    })

    restoreCreateElement = () => createElementSpy.mockRestore()
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => {
        root.unmount()
      })

      container.remove()
    })

    mountedRoots.length = 0
    restoreCreateElement()
    restoreCreateElement = () => {}
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('previews and exports the selected filter through callbacks', async () => {
    const onFilterBaseChange = vi.fn()
    const onFilterChange = vi.fn()
    const onFilterExportingChange = vi.fn()
    const onImageExported = vi.fn()
    const image = createImage()
    const view = renderFiltersStep({
      activeImage: image,
      onFilterBaseChange,
      onFilterChange,
      onFilterExportingChange,
      onImageExported,
    })

    mountedRoots.push(view)

    await clickButton(getButton(view.container, 'Moon'))

    expect(onFilterBaseChange).toHaveBeenCalledWith(
      image.id,
      expect.objectContaining({
        file: image.file,
        objectUrl: image.previewUrl,
      }),
    )
    expect(onFilterExportingChange).toHaveBeenNthCalledWith(1, image.id, true)
    expect(onFilterChange).toHaveBeenCalledWith(image.id, 'moon')
    expect(createImageBitmapMock).toHaveBeenCalledWith(image.file)
    expect(drawImageMock).toHaveBeenCalledTimes(1)
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1)
    expect(onImageExported).toHaveBeenCalledWith(
      image.id,
      expect.objectContaining({
        file: expect.any(File),
        fileInfo: expect.objectContaining({
          name: image.file?.name,
          type: image.file?.type,
        }),
        objectUrl: 'blob:filtered-output',
      }),
    )
    expect(onFilterExportingChange).toHaveBeenLastCalledWith(image.id, false)
  })

  it('exports repeated filter changes from the initial base file', async () => {
    const onFilterChange = vi.fn()
    const onImageExported = vi.fn()
    const cropped = createExported('cropped.jpg')
    const filtered = createExported('filtered.jpg')
    const image = createImage({
      exported: cropped,
      filter: 'normal',
    })
    const view = renderFiltersStep({
      activeImage: image,
      onFilterChange,
      onImageExported,
    })

    mountedRoots.push(view)

    await clickButton(getButton(view.container, 'Moon'))

    act(() => {
      view.root.render(
        <FiltersStep
          activeImage={{ ...image, exported: filtered, filter: 'moon' }}
          onFilterBaseChange={vi.fn()}
          onFilterChange={onFilterChange}
          onFilterExportingChange={vi.fn()}
          onImageExported={onImageExported}
        />,
      )
    })

    await clickButton(getButton(view.container, 'Lark'))

    expect(createImageBitmapMock).toHaveBeenNthCalledWith(1, cropped.file)
    expect(createImageBitmapMock).toHaveBeenNthCalledWith(2, cropped.file)
    expect(onFilterChange).toHaveBeenLastCalledWith(image.id, 'lark')
  })

  it('uses stored crop base after remount instead of filtered export', async () => {
    const onFilterChange = vi.fn()
    const onImageExported = vi.fn()
    const cropped = createExported('cropped.jpg')
    const filtered = createExported('filtered.jpg')
    const image = createImage({
      exported: filtered,
      filter: 'moon',
      filterBase: cropped,
    })
    const view = renderFiltersStep({
      activeImage: image,
      onFilterChange,
      onImageExported,
    })

    mountedRoots.push(view)

    await clickButton(getButton(view.container, 'Normal'))

    expect(createImageBitmapMock).toHaveBeenCalledWith(cropped.file)
    expect(onFilterChange).toHaveBeenCalledWith(image.id, 'normal')
  })

  it('closes image bitmap when canvas export fails', async () => {
    const onImageExported = vi.fn()
    const image = createImage()
    const view = renderFiltersStep({
      activeImage: image,
      onImageExported,
    })

    mountedRoots.push(view)
    restoreCreateElement()
    restoreCreateElement = () => {}

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)

      if (tagName === 'canvas') {
        Object.defineProperty(element, 'getContext', {
          configurable: true,
          value: () => null,
        })
      }

      return element
    })

    restoreCreateElement = () => createElementSpy.mockRestore()

    await clickButton(getButton(view.container, 'Moon'))

    expect(closeImageBitmapMock).toHaveBeenCalledTimes(1)
    expect(onImageExported).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain('Failed to apply filter. Try another filter.')
  })

  it('does not call export callbacks after unmount', async () => {
    const onFilterChange = vi.fn()
    const onImageExported = vi.fn()
    let pendingBlobCallback: BlobCallback | null = null
    const image = createImage()

    restoreCreateElement()
    restoreCreateElement = () => {}

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)

      if (tagName === 'canvas') {
        Object.defineProperty(element, 'getContext', {
          configurable: true,
          value: () => ({
            drawImage: drawImageMock,
            filter: '',
          }),
        })
        Object.defineProperty(element, 'toBlob', {
          configurable: true,
          value: (callback: BlobCallback) => {
            pendingBlobCallback = callback
          },
        })
      }

      return element
    })

    restoreCreateElement = () => createElementSpy.mockRestore()

    const view = renderFiltersStep({
      activeImage: image,
      onFilterChange,
      onImageExported,
    })

    await act(async () => {
      getButton(view.container, 'Moon').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(pendingBlobCallback).toBeTypeOf('function')

    act(() => {
      view.root.unmount()
    })
    view.container.remove()

    await act(async () => {
      pendingBlobCallback?.(new Blob(['filtered'], { type: 'image/jpeg' }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(onFilterChange).not.toHaveBeenCalled()
    expect(onImageExported).not.toHaveBeenCalled()
  })
})
