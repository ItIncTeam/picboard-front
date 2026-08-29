import { act, useCallback, useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatePostImage, ImageFilter } from '@/features/create-post'
import { I18nProvider } from '@/shared/lib/i18n'

import { FiltersStep } from '../FiltersStep'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

type BlobController = {
  resolve: (blob: Blob | null) => void
}

const filterMocks = vi.hoisted(() => ({
  bitmapClose: vi.fn(),
  createImageBitmap: vi.fn(),
  drawImage: vi.fn(),
  images: [] as CreatePostImage[],
  pendingBlobCallbacks: [] as BlobCallback[],
  urlIndex: 0,
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt = '',
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img {...props} alt={alt} />
  ),
}))

function createArtifact(name: string, objectUrl: string) {
  const file = new File([name], name, { type: 'image/jpeg' })

  return {
    file,
    objectUrl,
    fileInfo: {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
    },
  }
}

function createImage(id: string, filter: ImageFilter = 'normal'): CreatePostImage {
  const original = new File([`original-${id}`], `${id}-original.jpg`, { type: 'image/jpeg' })
  const cropped = createArtifact(`${id}-cropped.jpg`, `blob:${id}-cropped`)

  return {
    aspectRatio: '1:1',
    cropped,
    exported: filter === 'normal' ? cropped : undefined,
    file: original,
    filter,
    id,
    name: original.name,
    previewUrl: `blob:${id}-original`,
  }
}

function FiltersHarness({
  initialActiveImageId,
  initialImages,
  onExportingChange = () => undefined,
}: {
  initialActiveImageId: string
  initialImages: CreatePostImage[]
  onExportingChange?: (isExporting: boolean) => void
}) {
  const [images, setImages] = useState(initialImages)
  const [activeImageId, setActiveImageId] = useState<string | null>(initialActiveImageId)
  const activeImage = images.find(({ id }) => id === activeImageId) ?? null
  const handleFilterChange = useCallback((imageId: string, filter: ImageFilter) => {
    setImages((current) =>
      current.map((image) =>
        image.id === imageId ? { ...image, exported: undefined, filter } : image,
      ),
    )
  }, [])
  const handleImageExported = useCallback(
    (imageId: string, exported: CreatePostImage['exported']) => {
      setImages((current) =>
        current.map((image) => (image.id === imageId ? { ...image, exported } : image)),
      )
    },
    [],
  )
  const handleRemoveImage = useCallback((imageId: string) => {
    setImages((current) => {
      const nextImages = current.filter(({ id }) => id !== imageId)
      setActiveImageId((currentActive) =>
        currentActive === imageId ? (nextImages[0]?.id ?? null) : currentActive,
      )
      return nextImages
    })
  }, [])

  useEffect(() => {
    filterMocks.images = images
  }, [images])

  return (
    <FiltersStep
      activeImage={activeImage}
      images={images}
      onExportingChange={onExportingChange}
      onFilterChange={handleFilterChange}
      onImageExported={handleImageExported}
      onRemoveImage={handleRemoveImage}
      onSetActiveImage={setActiveImageId}
    />
  )
}

function renderFilters(
  initialImages: CreatePostImage[],
  activeImageId = initialImages[0]?.id ?? '',
) {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(
      <I18nProvider>
        <FiltersHarness initialActiveImageId={activeImageId} initialImages={initialImages} />
      </I18nProvider>,
    )
  })

  return { container, root }
}

function clickButton(container: HTMLElement, name: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent === name || item.getAttribute('aria-label') === name,
  )

  if (!button) {
    throw new Error(`Expected button "${name}".`)
  }

  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function takeBlobController(): BlobController {
  const callback = filterMocks.pendingBlobCallbacks.shift()

  if (!callback) {
    throw new Error('Expected a pending canvas export.')
  }

  return { resolve: (blob) => callback(blob) }
}

describe('FiltersStep', () => {
  const views: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    filterMocks.images = []
    filterMocks.pendingBlobCallbacks = []
    filterMocks.urlIndex = 0
    filterMocks.bitmapClose.mockReset()
    filterMocks.createImageBitmap.mockReset()
    filterMocks.createImageBitmap.mockResolvedValue({
      close: filterMocks.bitmapClose,
      height: 80,
      width: 120,
    })
    filterMocks.drawImage.mockReset()

    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      value: filterMocks.createImageBitmap,
      writable: true,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => {
        filterMocks.urlIndex += 1
        return `blob:filtered-${file.name}-${filterMocks.urlIndex}`
      }),
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: filterMocks.drawImage,
      filter: 'none',
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      filterMocks.pendingBlobCallbacks.push(callback)
    })
  })

  afterEach(() => {
    views.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    views.length = 0
    vi.restoreAllMocks()
  })

  it('reuses cropped artifact for Normal without canvas export', async () => {
    const image = { ...createImage('A'), exported: undefined }
    const view = renderFilters([image])
    views.push(view)

    await flushEffects()

    expect(filterMocks.images[0]?.exported).toBe(image.cropped)
    expect(filterMocks.createImageBitmap).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('always exports non-normal filters from cropped file instead of original or previous export', async () => {
    const image = createImage('A')
    const view = renderFilters([image])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    const clarendonExport = takeBlobController()
    clarendonExport.resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()
    const clarendonArtifact = filterMocks.images[0]?.exported

    expect(clarendonArtifact).toEqual(
      expect.objectContaining({
        file: expect.objectContaining({ name: image.cropped?.file.name, type: 'image/jpeg' }),
        fileInfo: expect.objectContaining({ name: image.cropped?.file.name, type: 'image/jpeg' }),
      }),
    )

    clickButton(view.container, 'Moon')
    await flushEffects()

    expect(filterMocks.createImageBitmap).toHaveBeenNthCalledWith(1, image.cropped?.file)
    expect(filterMocks.createImageBitmap).toHaveBeenNthCalledWith(2, image.cropped?.file)
    const filterInputs = filterMocks.createImageBitmap.mock.calls.map(([file]) => file)

    expect(filterInputs.every((file) => file !== image.file)).toBe(true)
    expect(filterInputs.every((file) => file !== clarendonArtifact?.file)).toBe(true)
  })

  it('closes the bitmap when drawing the filtered image fails', async () => {
    const image = createImage('A')
    const view = renderFilters([image])
    views.push(view)
    filterMocks.drawImage.mockImplementationOnce(() => {
      throw new Error('Canvas draw failed.')
    })

    clickButton(view.container, 'Clarendon')
    await flushEffects()

    expect(filterMocks.bitmapClose).toHaveBeenCalledTimes(1)
    expect(view.container.querySelector('[role="alert"]')?.textContent).toContain(
      'Canvas draw failed.',
    )
  })

  it('keeps only the latest result after rapid filter changes and revokes the stale artifact', async () => {
    const image = createImage('A')
    const view = renderFilters([image])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    const clarendonExport = takeBlobController()
    clickButton(view.container, 'Moon')
    await flushEffects()
    const moonExport = takeBlobController()

    moonExport.resolve(new Blob(['moon'], { type: 'image/jpeg' }))
    await flushEffects()
    const moonArtifact = filterMocks.images[0]?.exported

    clarendonExport.resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()

    expect(filterMocks.images[0]?.filter).toBe('moon')
    expect(filterMocks.images[0]?.exported).toBe(moonArtifact)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('cancels an active export when another image becomes active', async () => {
    const firstImage = createImage('A')
    const secondImage = createImage('B')
    const view = renderFilters([firstImage, secondImage])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    const firstExport = takeBlobController()
    clickButton(view.container, 'Select image B')
    firstExport.resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()

    expect(filterMocks.images[0]?.exported).toBeUndefined()
    expect(filterMocks.images[1]?.exported).toBe(secondImage.cropped)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('cancels an active export when its image is removed', async () => {
    const firstImage = createImage('A')
    const secondImage = createImage('B')
    const view = renderFilters([firstImage, secondImage])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    const firstExport = takeBlobController()
    clickButton(view.container, 'Remove image A')
    firstExport.resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()

    expect(filterMocks.images.map(({ id }) => id)).toEqual(['B'])
    expect(filterMocks.images[0]?.exported).toBe(secondImage.cropped)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('preserves per-image filters and exports when switching A to B and back', async () => {
    const firstImage = createImage('A')
    const secondImage = createImage('B')
    const view = renderFilters([firstImage, secondImage])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    takeBlobController().resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()
    const firstExport = filterMocks.images[0]?.exported

    clickButton(view.container, 'Select image B')
    clickButton(view.container, 'Moon')
    await flushEffects()
    takeBlobController().resolve(new Blob(['moon'], { type: 'image/jpeg' }))
    await flushEffects()
    const secondExport = filterMocks.images[1]?.exported

    clickButton(view.container, 'Select image A')

    expect(filterMocks.images.map(({ id }) => id)).toEqual(['A', 'B'])
    expect(filterMocks.images[0]).toEqual(
      expect.objectContaining({ exported: firstExport, filter: 'clarendon' }),
    )
    expect(filterMocks.images[1]).toEqual(
      expect.objectContaining({ exported: secondExport, filter: 'moon' }),
    )
  })

  it('returns to cropped artifact when Normal is selected after a filtered export', async () => {
    const image = createImage('A')
    const view = renderFilters([image])
    views.push(view)

    clickButton(view.container, 'Clarendon')
    await flushEffects()
    takeBlobController().resolve(new Blob(['clarendon'], { type: 'image/jpeg' }))
    await flushEffects()
    const filteredArtifact = filterMocks.images[0]?.exported

    clickButton(view.container, 'Normal')
    await flushEffects()

    expect(filterMocks.images[0]?.exported).toBe(image.cropped)
    expect(filterMocks.images[0]?.exported).not.toBe(filteredArtifact)
    expect(filterMocks.createImageBitmap).toHaveBeenCalledTimes(1)
  })
})
