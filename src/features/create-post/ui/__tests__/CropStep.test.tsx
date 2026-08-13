import { act, createRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AspectRatio, CreatePostCropGeometry, CreatePostImage } from '@/features/create-post'

import { CropStep, type CropStepHandle } from '../CropStep'

type CropperState = {
  boundary: { height: number; width: number }
  coordinates: { height: number; left: number; top: number; width: number }
  imageSize: { height: number; width: number }
  transforms: { flip: { horizontal: boolean; vertical: boolean }; rotate: number }
  visibleArea: { height: number; left: number; top: number; width: number }
}

type CanvasController = {
  canvas: HTMLCanvasElement
  reject: (error: Error) => void
  resolve: (blob: Blob | null) => void
}

const cropperMocks = vi.hoisted(() => ({
  canvas: null as HTMLCanvasElement | null,
  changeBeforeReady: false,
  restoredStates: [] as CropperState[],
  state: {
    boundary: { height: 640, width: 640 },
    coordinates: { height: 320, left: 10, top: 20, width: 320 },
    imageSize: { height: 1280, width: 1280 },
    transforms: { flip: { horizontal: false, vertical: false }, rotate: 0 },
    visibleArea: { height: 640, left: 0, top: 0, width: 640 },
  } as CropperState,
}))

vi.mock('react-advanced-cropper', async () => {
  const React = await import('react')

  return {
    Cropper: React.forwardRef(function MockCropper(
      {
        onChange,
        onReady,
        src,
        stencilProps,
      }: {
        onChange?: (cropper: unknown) => void
        onReady?: (cropper: unknown) => void
        src?: string
        stencilProps?: { aspectRatio?: number }
      },
      ref: React.ForwardedRef<unknown>,
    ) {
      const cropper = React.useMemo(
        () => ({
          getCanvas: () => cropperMocks.canvas,
          getState: () => cropperMocks.state,
          setState: (
            modifier: CropperState | ((state: CropperState | null) => CropperState | null) | null,
          ) => {
            const nextState =
              typeof modifier === 'function' ? modifier(cropperMocks.state) : modifier

            if (nextState) {
              cropperMocks.state = nextState
              cropperMocks.restoredStates.push(nextState)
            }
          },
        }),
        [],
      )

      React.useImperativeHandle(ref, () => cropper)
      React.useEffect(() => {
        if (cropperMocks.changeBeforeReady) {
          onChange?.(cropper)
        }

        onReady?.(cropper)
      }, [cropper, onChange, onReady])

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
    }),
  }
})

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt = '',
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img {...props} alt={alt} />
  ),
}))

vi.mock('@/shared/assets', () => ({
  AddImage: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ArrowBackIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ArrowNextIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatio16_9: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatio1_1: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatio4_5: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatioBtn: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatioOrigin: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  Close: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  Dot: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ShowSwiper: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('@/shared/ui', () => ({
  IconButton: ({
    icon: _icon,
    label,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
  }) => (
    <button {...props} aria-label={label} type="button">
      {label}
    </button>
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  rerender: (props: TestCropStepProps) => void
  root: Root
}

type TestCropStepProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onAspectRatioChange?: (imageId: string, ratio: AspectRatio) => void
  onCropGeometryChange?: (imageId: string, geometry: CreatePostCropGeometry) => void
  onRemoveImage?: (imageId: string) => void
  onSetActiveImage?: (imageId: string | null) => void
}

function createImage(id: string, ratio: AspectRatio = 'original'): CreatePostImage {
  const file = new File([`original-${id}`], `${id}.jpg`, { type: 'image/jpeg' })

  return {
    id,
    name: file.name,
    file,
    fileInfo: {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
    },
    previewUrl: `blob:${id}-original`,
    aspectRatio: ratio,
    filter: 'normal',
  }
}

function createExportedPayloadForCropStep(): NonNullable<CreatePostImage['exported']> {
  const file = new File(['exported'], 'exported.jpg', { type: 'image/jpeg' })

  return {
    file,
    objectUrl: 'blob:exported',
    fileInfo: {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
    },
  }
}

function createCanvasController(): CanvasController {
  let resolveBlob: BlobCallback = () => undefined
  let rejectBlob: (error: Error) => void = () => undefined
  const result = new Promise<Blob | null>((resolve, reject) => {
    resolveBlob = resolve
    rejectBlob = reject
  })
  const canvas = {
    toBlob: (callback: BlobCallback) => {
      void result.then(callback)
    },
  } as HTMLCanvasElement

  return {
    canvas,
    reject: rejectBlob,
    resolve: resolveBlob,
  }
}

function renderCropStep(
  props: TestCropStepProps,
  exportRef = createRef<CropStepHandle>(),
): RenderResult & { exportRef: React.RefObject<CropStepHandle | null> } {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  const render = (nextProps: TestCropStepProps) => {
    root.render(
      <CropStep
        activeImage={nextProps.activeImage}
        disabled={false}
        exportRef={exportRef}
        images={nextProps.images}
        onAddImages={() => undefined}
        onAspectRatioChange={nextProps.onAspectRatioChange ?? (() => undefined)}
        onCropGeometryChange={nextProps.onCropGeometryChange ?? (() => undefined)}
        onRemoveImage={nextProps.onRemoveImage ?? (() => undefined)}
        onSetActiveImage={nextProps.onSetActiveImage ?? (() => undefined)}
      />,
    )
  }

  act(() => render(props))

  return {
    container,
    exportRef,
    rerender: (nextProps) => act(() => render(nextProps)),
    root,
  }
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

function getMockCropper(container: HTMLElement): HTMLButtonElement {
  const cropper = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'Change cropper',
  )

  if (!cropper) {
    throw new Error('Expected mock cropper.')
  }

  return cropper
}

function StatefulCropStep({
  initialActiveImageId,
  initialImages,
}: {
  initialActiveImageId: string
  initialImages: CreatePostImage[]
}) {
  const [images, setImages] = useState(initialImages)
  const [activeImageId, setActiveImageId] = useState<string | null>(initialActiveImageId)
  const activeImage = images.find((image) => image.id === activeImageId) ?? null

  return (
    <CropStep
      activeImage={activeImage}
      images={images}
      onAddImages={(newImages) => setImages((current) => [...current, ...newImages])}
      onAspectRatioChange={(imageId, aspectRatio) =>
        setImages((current) =>
          current.map((image) => (image.id === imageId ? { ...image, aspectRatio } : image)),
        )
      }
      onCropGeometryChange={(imageId, cropGeometry) =>
        setImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  cropGeometry,
                  cropped: undefined,
                  exported: undefined,
                }
              : image,
          ),
        )
      }
      onRemoveImage={(imageId) =>
        setImages((current) => current.filter((image) => image.id !== imageId))
      }
      onSetActiveImage={setActiveImageId}
    />
  )
}

function renderStatefulCropStep(
  initialImages: CreatePostImage[],
  initialActiveImageId: string,
): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(
      <StatefulCropStep
        initialActiveImageId={initialActiveImageId}
        initialImages={initialImages}
      />,
    )
  })

  return { container, rerender: () => undefined, root }
}

function removeThumbnail(container: HTMLElement, imageName: string) {
  const thumbnail = container.querySelector(`img[alt="${imageName}"]`)?.closest('[role="button"]')
  const removeButton = thumbnail?.querySelector<HTMLButtonElement>(
    'button[aria-label="deleteImage"]',
  )

  if (!removeButton) {
    throw new Error(`Expected remove button for "${imageName}".`)
  }

  act(() => removeButton.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}

describe('CropStep export boundary', () => {
  const views: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    cropperMocks.canvas = null
    cropperMocks.changeBeforeReady = false
    cropperMocks.restoredStates = []
    cropperMocks.state = {
      boundary: { height: 640, width: 640 },
      coordinates: { height: 320, left: 10, top: 20, width: 320 },
      imageSize: { height: 1280, width: 1280 },
      transforms: { flip: { horizontal: false, vertical: false }, rotate: 0 },
      visibleArea: { height: 640, left: 0, top: 0, width: 640 },
    }

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:crop-export'),
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    views.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    views.length = 0
  })

  it('exports the current canvas without mutating the original image', async () => {
    const image = createImage('image-1', '1:1')
    const controller = createCanvasController()

    cropperMocks.canvas = controller.canvas

    const view = renderCropStep({ activeImage: image, images: [image] })
    views.push(view)
    const exportPromise = view.exportRef.current?.exportActiveImage()

    expect(exportPromise).toBeInstanceOf(Promise)

    controller.resolve(new Blob(['cropped'], { type: 'image/jpeg' }))

    const result = await exportPromise

    expect(result?.imageId).toBe(image.id)
    expect(result?.ratio).toBe('1:1')
    expect(result?.cropped.file).not.toBe(image.file)
    expect(result?.cropped.file.type).toBe('image/jpeg')
    expect(image.file && (await image.file.text())).toBe('original-image-1')
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('always gives the cropper the immutable original preview source', () => {
    const image = {
      ...createImage('image-1'),
      exported: {
        ...createExportedPayloadForCropStep(),
        objectUrl: 'blob:previous-export',
      },
    }
    const view = renderCropStep({ activeImage: image, images: [image] })
    views.push(view)

    expect(getMockCropper(view.container)).toHaveAttribute('data-cropper-src', image.previewUrl)
    expect(getMockCropper(view.container)).not.toHaveAttribute(
      'data-cropper-src',
      image.exported.objectUrl,
    )
  })

  it('uses the active image ratio and does not carry ratio between images', async () => {
    const firstImage = createImage('image-1', '16:9')
    const secondImage = createImage('image-2', '4:5')
    const firstController = createCanvasController()

    cropperMocks.canvas = firstController.canvas

    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
    })
    views.push(view)
    expect(Number(getMockCropper(view.container).dataset.stencilAspectRatio)).toBe(16 / 9)
    const firstExport = view.exportRef.current?.exportActiveImage()
    firstController.resolve(new Blob(['first'], { type: 'image/jpeg' }))

    expect((await firstExport)?.ratio).toBe('16:9')

    const secondController = createCanvasController()
    cropperMocks.canvas = secondController.canvas
    view.rerender({ activeImage: secondImage, images: [firstImage, secondImage] })
    expect(Number(getMockCropper(view.container).dataset.stencilAspectRatio)).toBe(4 / 5)
    const secondExport = view.exportRef.current?.exportActiveImage()
    secondController.resolve(new Blob(['second'], { type: 'image/jpeg' }))

    expect((await secondExport)?.ratio).toBe('4:5')
  })

  it('keeps the active image when an inactive thumbnail is removed', () => {
    const images = [createImage('A'), createImage('B'), createImage('C')]
    const view = renderStatefulCropStep(images, images[0].id)
    views.push(view)

    clickButton(view.container, 'showSwiper')
    removeThumbnail(view.container, images[1].name)

    expect(getMockCropper(view.container)).toHaveAttribute('data-cropper-src', images[0].previewUrl)
    expect(
      view.container.querySelector(`img[alt="${images[0].name}"]`)?.closest('[role="button"]'),
    ).toHaveAttribute('data-active', 'true')
  })

  it('selects the next neighboring image when the active thumbnail is removed', () => {
    const images = [createImage('A', '1:1'), createImage('B', '4:5'), createImage('C', '16:9')]
    const view = renderStatefulCropStep(images, images[0].id)
    views.push(view)

    clickButton(view.container, 'showSwiper')
    removeThumbnail(view.container, images[0].name)

    expect(getMockCropper(view.container)).toHaveAttribute('data-cropper-src', images[1].previewUrl)
    expect(Number(getMockCropper(view.container).dataset.stencilAspectRatio)).toBe(4 / 5)
    expect(
      view.container.querySelector(`img[alt="${images[1].name}"]`)?.closest('[role="button"]'),
    ).toHaveAttribute('data-active', 'true')
  })

  it('reuses an unchanged export and re-encodes after crop coordinates change', async () => {
    const onCropGeometryChange = vi.fn()
    const image = createImage('image-1')
    const controller = createCanvasController()
    cropperMocks.canvas = controller.canvas
    const view = renderCropStep({ activeImage: image, images: [image], onCropGeometryChange })
    views.push(view)
    const initialExportPromise = view.exportRef.current?.exportActiveImage()
    controller.resolve(new Blob(['initial'], { type: 'image/jpeg' }))
    const initialExport = await initialExportPromise
    const exportedImage = {
      ...image,
      cropGeometry: initialExport?.geometry,
      cropped: initialExport?.cropped,
      exported: initialExport?.cropped,
    }

    view.rerender({
      activeImage: exportedImage,
      images: [exportedImage],
      onCropGeometryChange,
    })

    expect(await view.exportRef.current?.exportActiveImage()).toEqual(
      expect.objectContaining({ cropped: initialExport?.cropped }),
    )
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)

    cropperMocks.state = {
      ...cropperMocks.state,
      coordinates: { ...cropperMocks.state.coordinates, left: 24 },
    }
    clickButton(view.container, 'Change cropper')

    expect(onCropGeometryChange).toHaveBeenCalledWith(image.id, expect.any(Object))

    const dirtyExport = view.exportRef.current?.exportActiveImage()

    expect((await dirtyExport)?.cropped).not.toBe(initialExport?.cropped)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('does not invalidate an export when only boundary and image size change', async () => {
    const onCropGeometryChange = vi.fn()
    const image = createImage('image-1')
    const controller = createCanvasController()
    cropperMocks.canvas = controller.canvas
    const view = renderCropStep({ activeImage: image, images: [image], onCropGeometryChange })
    views.push(view)
    const initialExportPromise = view.exportRef.current?.exportActiveImage()
    controller.resolve(new Blob(['initial'], { type: 'image/jpeg' }))
    const initialExport = await initialExportPromise
    const exportedImage = {
      ...image,
      cropGeometry: initialExport?.geometry,
      cropped: initialExport?.cropped,
      exported: initialExport?.cropped,
    }

    view.rerender({ activeImage: exportedImage, images: [exportedImage], onCropGeometryChange })
    cropperMocks.state = {
      ...cropperMocks.state,
      boundary: { height: 400, width: 320 },
      imageSize: { height: 800, width: 800 },
    }
    clickButton(view.container, 'Change cropper')

    expect(onCropGeometryChange).not.toHaveBeenCalled()
    expect(await view.exportRef.current?.exportActiveImage()).toEqual(
      expect.objectContaining({ cropped: initialExport?.cropped }),
    )
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('keeps a valid export when switching away and back without crop changes', async () => {
    const firstImage = createImage('image-1')
    const secondImage = createImage('image-2')
    const controller = createCanvasController()
    cropperMocks.canvas = controller.canvas
    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
    })
    views.push(view)
    const initialExportPromise = view.exportRef.current?.exportActiveImage()
    controller.resolve(new Blob(['initial'], { type: 'image/jpeg' }))
    const initialExport = await initialExportPromise
    const exportedFirstImage = {
      ...firstImage,
      cropGeometry: initialExport?.geometry,
      cropped: initialExport?.cropped,
      exported: initialExport?.cropped,
    }

    view.rerender({
      activeImage: exportedFirstImage,
      images: [exportedFirstImage, secondImage],
    })
    view.rerender({
      activeImage: secondImage,
      images: [exportedFirstImage, secondImage],
    })
    view.rerender({
      activeImage: exportedFirstImage,
      images: [exportedFirstImage, secondImage],
    })

    expect(await view.exportRef.current?.exportActiveImage()).toEqual(
      expect.objectContaining({ cropped: initialExport?.cropped }),
    )
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('restores reducer-owned geometry when switching images and returning', () => {
    const firstGeometry: CreatePostCropGeometry = {
      coordinates: { height: 240, left: 31, top: 41, width: 260 },
      transforms: { flip: { horizontal: true, vertical: false }, rotate: 90 },
      visibleArea: { height: 500, left: 12, top: 14, width: 520 },
    }
    const secondGeometry: CreatePostCropGeometry = {
      coordinates: { height: 180, left: 51, top: 61, width: 200 },
      transforms: { flip: { horizontal: false, vertical: true }, rotate: 180 },
      visibleArea: { height: 420, left: 22, top: 24, width: 440 },
    }
    const firstImage = { ...createImage('image-1'), cropGeometry: firstGeometry }
    const secondImage = { ...createImage('image-2'), cropGeometry: secondGeometry }
    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
    })
    views.push(view)

    expect(cropperMocks.state.coordinates).toEqual(firstGeometry.coordinates)
    expect(cropperMocks.state.visibleArea).toEqual(firstGeometry.visibleArea)
    expect(cropperMocks.state.transforms).toEqual(firstGeometry.transforms)

    view.rerender({ activeImage: secondImage, images: [firstImage, secondImage] })
    expect(cropperMocks.state.coordinates).toEqual(secondGeometry.coordinates)

    view.rerender({ activeImage: firstImage, images: [firstImage, secondImage] })
    expect(cropperMocks.state.coordinates).toEqual(firstGeometry.coordinates)
    expect(cropperMocks.state.visibleArea).toEqual(firstGeometry.visibleArea)
    expect(cropperMocks.state.transforms).toEqual(firstGeometry.transforms)
  })

  it('restores geometry after remount without replacing an unchanged cropped artifact', async () => {
    const cropped = createExportedPayloadForCropStep()
    const geometry: CreatePostCropGeometry = {
      coordinates: { height: 230, left: 33, top: 44, width: 250 },
      transforms: { flip: { horizontal: true, vertical: false }, rotate: 90 },
      visibleArea: { height: 510, left: 13, top: 15, width: 530 },
    }
    const image = {
      ...createImage('image-1'),
      cropGeometry: geometry,
      cropped,
      exported: cropped,
    }
    const firstView = renderCropStep({ activeImage: image, images: [image] })

    act(() => firstView.root.unmount())
    firstView.container.remove()

    cropperMocks.state = {
      boundary: { height: 400, width: 320 },
      coordinates: { height: 100, left: 0, top: 0, width: 100 },
      imageSize: { height: 800, width: 800 },
      transforms: { flip: { horizontal: false, vertical: false }, rotate: 0 },
      visibleArea: { height: 320, left: 0, top: 0, width: 320 },
    }

    const remountedView = renderCropStep({ activeImage: image, images: [image] })
    views.push(remountedView)

    const result = await remountedView.exportRef.current?.exportActiveImage()

    expect(cropperMocks.state.boundary).toEqual({ height: 400, width: 320 })
    expect(cropperMocks.state.imageSize).toEqual({ height: 800, width: 800 })
    expect(cropperMocks.state.coordinates).toEqual(geometry.coordinates)
    expect(cropperMocks.state.visibleArea).toEqual(geometry.visibleArea)
    expect(cropperMocks.state.transforms).toEqual(geometry.transforms)
    expect(result?.cropped).toBe(cropped)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('ignores default cropper change emitted before persisted geometry is restored', () => {
    const onCropGeometryChange = vi.fn()
    const geometry: CreatePostCropGeometry = {
      coordinates: { height: 230, left: 33, top: 44, width: 250 },
      transforms: { flip: { horizontal: true, vertical: false }, rotate: 90 },
      visibleArea: { height: 510, left: 13, top: 15, width: 530 },
    }
    const cropped = createExportedPayloadForCropStep()
    const image = {
      ...createImage('image-1'),
      cropGeometry: geometry,
      cropped,
      exported: cropped,
    }
    cropperMocks.changeBeforeReady = true
    cropperMocks.state = {
      ...cropperMocks.state,
      coordinates: { height: 100, left: 0, top: 0, width: 100 },
    }

    const view = renderCropStep({
      activeImage: image,
      images: [image],
      onCropGeometryChange,
    })
    views.push(view)

    expect(onCropGeometryChange).not.toHaveBeenCalled()
    expect(cropperMocks.state.coordinates).toEqual(geometry.coordinates)
  })

  it('allows only the latest overlapping export request to complete', async () => {
    const image = createImage('image-1')
    const controller = createCanvasController()
    cropperMocks.canvas = controller.canvas
    const view = renderCropStep({ activeImage: image, images: [image] })
    views.push(view)
    const firstExport = view.exportRef.current?.exportActiveImage()
    const latestExport = view.exportRef.current?.exportActiveImage()
    controller.resolve(new Blob(['latest'], { type: 'image/jpeg' }))

    await expect(firstExport).rejects.toThrow('cancelled')
    await expect(latestExport).resolves.toEqual(expect.objectContaining({ imageId: image.id }))
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('rejects when the canvas cannot create an export blob', async () => {
    const image = createImage('image-1')
    const controller = createCanvasController()
    cropperMocks.canvas = controller.canvas
    const view = renderCropStep({ activeImage: image, images: [image] })
    views.push(view)

    const exportPromise = view.exportRef.current?.exportActiveImage()
    controller.resolve(null)

    await expect(exportPromise).rejects.toThrow('Could not export')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('rejects a pending export when the active image changes', async () => {
    const firstImage = createImage('image-1')
    const secondImage = createImage('image-2')
    const controller = createCanvasController()

    cropperMocks.canvas = controller.canvas

    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
    })
    views.push(view)
    const exportPromise = view.exportRef.current?.exportActiveImage()

    view.rerender({ activeImage: secondImage, images: [firstImage, secondImage] })
    controller.resolve(new Blob(['stale'], { type: 'image/jpeg' }))

    await expect(exportPromise).rejects.toThrow('cancelled')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('rejects a pending export after unmount', async () => {
    const image = createImage('image-1')
    const controller = createCanvasController()

    cropperMocks.canvas = controller.canvas

    const view = renderCropStep({ activeImage: image, images: [image] })
    const exportPromise = view.exportRef.current?.exportActiveImage()

    act(() => view.root.unmount())
    view.container.remove()
    controller.resolve(new Blob(['stale'], { type: 'image/jpeg' }))

    await expect(exportPromise).rejects.toThrow('cancelled')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
