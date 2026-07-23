import type { ButtonHTMLAttributes, ComponentType, ForwardedRef, ReactNode, SVGProps } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatePostImage } from '@/features/create-post'

import { CropStep } from '../CropStep'

type CanvasMock = {
  toBlob: (callback: (blob: Blob | null) => void) => void
}

type CropperMockRef = {
  getCanvas: () => CanvasMock | null
}

type RenderProps = {
  activeImage: CreatePostImage | null
  images?: CreatePostImage[]
  nextExportRequestId?: number
  onAspectRatioChange?: (imageId: string, aspectRatio: CreatePostImage['aspectRatio']) => void
  onImageExported?: (imageId: string, exported: CreatePostImage['exported']) => void
  onNextExportFailed?: () => void
  onNextImageExported?: (imageId: string, exported: CreatePostImage['exported']) => void
}

type RenderResult = {
  container: HTMLDivElement
  rerender: (props: RenderProps) => void
  root: Root
  unmount: () => void
}

const cropperMocks = vi.hoisted(() => ({
  getCanvas: vi.fn(),
  toBlobCallbacks: [] as Array<(blob: Blob | null) => void>,
}))

const createObjectUrlMock = vi.fn()
const revokeObjectUrlMock = vi.fn()

vi.mock('react-advanced-cropper', async () => {
  const React = await import('react')

  return {
    Cropper: React.forwardRef(function CropperMock(
      _props: { children?: ReactNode; src?: string },
      ref: ForwardedRef<CropperMockRef>,
    ) {
      React.useImperativeHandle(ref, () => ({
        getCanvas: cropperMocks.getCanvas,
      }))

      return React.createElement('div', { 'data-testid': 'cropper' })
    }),
  }
})

vi.mock('@/shared/assets', () => ({
  AddImage: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  ArrowBackIcon: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  ArrowNextIcon: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  AspectRatioBtn: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  Close: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  Dot: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  ShowSwiper: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('@/shared/ui', () => ({
  IconButton: ({
    icon: _icon,
    label,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ComponentType<SVGProps<SVGSVGElement>>
    label: string
  }) => (
    <button {...props} aria-label={label} type="button">
      {label}
    </button>
  ),
}))

vi.mock('../aspectButtonsBlock/AspectButtonsBlock', () => ({
  AspectButtonsBlock: ({
    onSelectRatio,
    selectedRatio,
  }: {
    onSelectRatio: (ratio: CreatePostImage['aspectRatio']) => void
    selectedRatio: CreatePostImage['aspectRatio']
  }) => (
    <button onClick={() => onSelectRatio(selectedRatio)} type="button">
      {selectedRatio}
    </button>
  ),
}))

function createImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  const file = new File(['original'], 'original.jpg', { type: 'image/jpeg' })

  return {
    aspectRatio: 'original',
    file,
    filter: 'normal',
    id: 'image-1',
    name: file.name,
    previewUrl: 'blob:original-preview',
    ...overrides,
  }
}

function renderCropStep(props: RenderProps): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)
  const render = (nextProps: RenderProps) => {
    const activeImage = nextProps.activeImage

    root.render(
      <CropStep
        activeImage={activeImage}
        images={nextProps.images ?? (activeImage ? [activeImage] : [])}
        nextExportRequestId={nextProps.nextExportRequestId ?? 0}
        onAddImages={vi.fn()}
        onAspectRatioChange={nextProps.onAspectRatioChange ?? vi.fn()}
        onImageExported={nextProps.onImageExported ?? vi.fn()}
        onNextExportFailed={nextProps.onNextExportFailed ?? vi.fn()}
        onNextImageExported={nextProps.onNextImageExported ?? vi.fn()}
        onRemoveImage={vi.fn()}
        onSetActiveImage={vi.fn()}
      />,
    )
  }

  document.body.append(container)

  act(() => {
    render(props)
  })

  return {
    container,
    rerender: (nextProps) => {
      act(() => {
        render(nextProps)
      })
    },
    root,
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

async function resolveExport(callbackIndex: number, blob: Blob | null = createBlob()) {
  await act(async () => {
    cropperMocks.toBlobCallbacks[callbackIndex](blob)
    await Promise.resolve()
    await Promise.resolve()
  })
}

function createBlob() {
  return new Blob(['cropped'], { type: 'image/jpeg' })
}

describe('CropStep crop export races', () => {
  const mountedViews: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    cropperMocks.toBlobCallbacks = []
    cropperMocks.getCanvas.mockReturnValue({
      toBlob: (callback: (blob: Blob | null) => void) => {
        cropperMocks.toBlobCallbacks.push(callback)
      },
    })
    createObjectUrlMock.mockReset()
    revokeObjectUrlMock.mockReset()
    createObjectUrlMock.mockReturnValue('blob:cropped-output')

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlMock,
    })
  })

  afterEach(() => {
    while (mountedViews.length > 0) {
      mountedViews.pop()?.unmount()
    }

    vi.clearAllMocks()
  })

  it('ignores export after unmount/back', async () => {
    const image = createImage()
    const onNextImageExported = vi.fn()
    const onNextExportFailed = vi.fn()
    const view = renderCropStep({
      activeImage: image,
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    view.unmount()

    await resolveExport(0)

    expect(onNextImageExported).not.toHaveBeenCalled()
    expect(onNextExportFailed).not.toHaveBeenCalled()
    expect(createObjectUrlMock).not.toHaveBeenCalled()
  })

  it('ignores export after active image removal', async () => {
    const image = createImage()
    const onNextImageExported = vi.fn()
    const onNextExportFailed = vi.fn()
    const view = renderCropStep({
      activeImage: image,
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    mountedViews.push(view)

    view.rerender({
      activeImage: null,
      images: [],
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    await resolveExport(0)

    expect(onNextImageExported).not.toHaveBeenCalled()
    expect(onNextExportFailed).not.toHaveBeenCalled()
    expect(createObjectUrlMock).not.toHaveBeenCalled()
  })

  it('ignores export after active image switch', async () => {
    const firstImage = createImage()
    const secondImage = createImage({ id: 'image-2', name: 'second.jpg' })
    const onNextImageExported = vi.fn()
    const onNextExportFailed = vi.fn()
    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    mountedViews.push(view)

    view.rerender({
      activeImage: secondImage,
      images: [firstImage, secondImage],
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    await resolveExport(0)

    expect(onNextImageExported).not.toHaveBeenCalled()
    expect(onNextExportFailed).not.toHaveBeenCalled()
    expect(createObjectUrlMock).not.toHaveBeenCalled()
  })

  it('ignores older export when a repeated export starts', async () => {
    const image = createImage()
    const onNextImageExported = vi.fn()
    const onNextExportFailed = vi.fn()
    const view = renderCropStep({
      activeImage: image,
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    mountedViews.push(view)

    view.rerender({
      activeImage: image,
      nextExportRequestId: 2,
      onNextExportFailed,
      onNextImageExported,
    })

    await resolveExport(0)

    expect(onNextImageExported).not.toHaveBeenCalled()
    expect(onNextExportFailed).not.toHaveBeenCalled()

    await resolveExport(1)

    expect(onNextImageExported).toHaveBeenCalledTimes(1)
    expect(onNextImageExported).toHaveBeenCalledWith(
      image.id,
      expect.objectContaining({ objectUrl: 'blob:cropped-output' }),
    )
  })

  it('revokes object URL when export becomes stale after URL creation', async () => {
    const firstImage = createImage()
    const secondImage = createImage({ id: 'image-2', name: 'second.jpg' })
    const onNextImageExported = vi.fn()
    const onNextExportFailed = vi.fn()
    const viewRef: { current: RenderResult | null } = { current: null }

    createObjectUrlMock.mockImplementation(() => {
      viewRef.current?.rerender({
        activeImage: secondImage,
        images: [firstImage, secondImage],
        nextExportRequestId: 1,
        onNextExportFailed,
        onNextImageExported,
      })

      return 'blob:stale-crop'
    })

    const view = renderCropStep({
      activeImage: firstImage,
      images: [firstImage, secondImage],
      nextExportRequestId: 1,
      onNextExportFailed,
      onNextImageExported,
    })

    viewRef.current = view
    mountedViews.push(view)

    await resolveExport(0)

    expect(onNextImageExported).not.toHaveBeenCalled()
    expect(onNextExportFailed).not.toHaveBeenCalled()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:stale-crop')
  })
})
