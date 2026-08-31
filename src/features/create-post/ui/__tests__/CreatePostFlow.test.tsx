import { act, StrictMode, useImperativeHandle } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPostInitialState,
  type AspectRatio,
  type CreatePostAction,
  type CreatePostCropGeometry,
  type CreatePostImage,
  type CreatePostState,
  type ImageFilter,
} from '@/features/create-post'

import { CreatePostFlow } from '../CreatePostFlow'

type UploadStepBoundaryProps = {
  activeImageId: string | null
  images: CreatePostImage[]
  onAddImages: (images: CreatePostImage[]) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type CropStepBoundaryProps = {
  activeImage: CreatePostImage | null
  disabled: boolean
  exportRef?: React.Ref<{ exportActiveImage: () => Promise<CropExportResult> }>
  images: CreatePostImage[]
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCropGeometryChange: (imageId: string, geometry: CreatePostCropGeometry) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type CropExportResult = {
  cropped: NonNullable<CreatePostImage['cropped']>
  geometry: CreatePostCropGeometry
  imageId: string
  ratio: AspectRatio
}

type FiltersStepBoundaryProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onExportingChange: (isExporting: boolean) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type PublicationStepBoundaryProps = {
  caption: string
  images: CreatePostImage[]
  isPublishing: boolean
  onCaptionChange: (caption: string) => void
  onRetryUpload: () => Promise<void> | void
}

const stepBoundaries = vi.hoisted(() => ({
  crop: null as CropStepBoundaryProps | null,
  filters: null as FiltersStepBoundaryProps | null,
  publication: null as PublicationStepBoundaryProps | null,
  upload: null as UploadStepBoundaryProps | null,
}))

const publishMocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  synchronizeCreatedPost: vi.fn(),
  uploadCreatePostImages: vi.fn(),
}))

const cropExportMocks = vi.hoisted(() => ({
  exportActiveImage: vi.fn<() => Promise<CropExportResult>>(),
}))

const cropGeometry: CreatePostCropGeometry = {
  coordinates: { height: 320, left: 10, top: 20, width: 320 },
  transforms: { flip: { horizontal: false, vertical: false }, rotate: 0 },
  visibleArea: { height: 640, left: 0, top: 0, width: 640 },
}

vi.mock('@/shared/assets', () => ({
  ArrowBackIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  Close: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('../../api/createPostApi', () => ({
  createPost: publishMocks.createPost,
}))

vi.mock('../../model/createPostUploadService', () => ({
  uploadCreatePostImages: publishMocks.uploadCreatePostImages,
}))

vi.mock('../../model/synchronizeCreatedPost', () => ({
  synchronizeCreatedPost: publishMocks.synchronizeCreatedPost,
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({
    asChild: _asChild,
    children,
    loading: _loading,
    loadingText: _loadingText,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
    variant?: string
  }) => (
    <button {...props} type="button">
      {children}
    </button>
  ),
}))

vi.mock('@/shared/ui/icon-button', () => ({
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

vi.mock('@/shared/ui/modal', () => ({
  Modal: ({
    children,
    modalTitle,
    open,
  }: {
    children: React.ReactNode
    modalTitle: string
    open: boolean
  }) =>
    open ? (
      <section aria-label={modalTitle} role="dialog">
        <h2>{modalTitle}</h2>
        {children}
      </section>
    ) : null,
}))

vi.mock('@/shared/ui/typography', () => ({
  Text: ({
    as: _as,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    as?: string
    children: React.ReactNode
  }) => <p {...props}>{children}</p>,
  Title: ({
    children,
    level: Component = 'h2',
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & {
    children: React.ReactNode
    level?: 'h1' | 'h2' | 'h3'
  }) => <Component {...props}>{children}</Component>,
}))

vi.mock('../UploadStep', () => ({
  UploadStep: (props: UploadStepBoundaryProps) => {
    stepBoundaries.upload = props

    return <section aria-label="Upload photo">Upload boundary</section>
  },
}))

vi.mock('../CropStep', () => ({
  CropStep: (props: CropStepBoundaryProps) => {
    stepBoundaries.crop = props
    useImperativeHandle(props.exportRef, () => ({
      exportActiveImage: cropExportMocks.exportActiveImage,
    }))

    return <section aria-label="Cropping">Crop boundary</section>
  },
  CropExportCancelledError: class CropExportCancelledError extends Error {},
}))

vi.mock('../FiltersStep', () => ({
  FiltersStep: (props: FiltersStepBoundaryProps) => {
    stepBoundaries.filters = props

    return <section aria-label="Filters">Filters boundary</section>
  },
}))

vi.mock('../PublicationStep', () => ({
  PublicationStep: (props: PublicationStepBoundaryProps) => {
    stepBoundaries.publication = props

    return <section aria-label="Publication">Publication boundary</section>
  },
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return {
    id: 'image-1',
    name: 'first.jpg',
    aspectRatio: '1:1',
    filter: 'normal',
    ...overrides,
  }
}

function createImageWithPreview(id: string, previewUrl = `blob:${id}`): CreatePostImage {
  return createImage({
    id,
    name: `${id}.jpg`,
    previewUrl,
  })
}

function createExportedImage(): CreatePostImage {
  const file = new File(['edited'], 'edited.jpg', { type: 'image/jpeg' })

  return createImage({
    exported: {
      file,
      objectUrl: 'blob:edited',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    },
  })
}

function createExportedPayload(): NonNullable<CreatePostImage['exported']> {
  const file = new File(['edited'], 'edited.jpg', { type: 'image/jpeg' })

  return {
    file,
    objectUrl: 'blob:edited',
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
  }
}

function createState(overrides: Partial<CreatePostState> = {}): CreatePostState {
  return {
    ...createPostInitialState,
    ...overrides,
  }
}

function renderCreatePostFlow({
  initialState,
  onCloseAction = vi.fn(),
  onPublishAction,
  strictMode = false,
}: {
  initialState?: CreatePostState
  onCloseAction?: () => void
  onPublishAction?: (state: CreatePostState) => Promise<void> | void
  strictMode?: boolean
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    const flow = (
      <CreatePostFlow
        initialState={initialState}
        onCloseAction={onCloseAction}
        onPublishAction={onPublishAction}
      />
    )
    root.render(strictMode ? <StrictMode>{flow}</StrictMode> : flow)
  })

  return { container, root }
}

function createDeferred<T = void>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined
  let reject: (reason?: unknown) => void = () => undefined

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

function queryButton(container: HTMLElement, name: string): HTMLButtonElement | null {
  return (
    Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === name || button.getAttribute('aria-label') === name,
    ) ?? null
  )
}

function getButton(container: HTMLElement, name: string): HTMLButtonElement {
  const button = queryButton(container, name)

  if (!button) {
    throw new Error(`Expected button "${name}".`)
  }

  return button
}

function clickButton(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function enableButtonForProgrammaticClick(button: HTMLButtonElement) {
  Object.defineProperty(button, 'disabled', {
    configurable: true,
    value: false,
  })
}

async function clickButtonAndFlush(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((resolve) => {
      window.setTimeout(resolve, 0)
    })
  })
}

function getHeaderTitle(container: HTMLElement): string {
  const title = container.querySelector('header h2')

  if (!title?.textContent) {
    throw new Error('Expected create post header title.')
  }

  return title.textContent
}

function expectNoBackendIntegrationProps(props: Record<string, unknown>) {
  expect(props).not.toHaveProperty('apolloClient')
  expect(props).not.toHaveProperty('createPost')
  expect(props).not.toHaveProperty('dispatch')
  expect(props).not.toHaveProperty('initiateUploadBatch')
  expect(props).not.toHaveProperty('completeUpload')
  expect(props).not.toHaveProperty('uploadService')
  expect(props).not.toHaveProperty('uploadToStorage')
}

describe('CreatePostFlow', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    stepBoundaries.crop = null
    stepBoundaries.filters = null
    stepBoundaries.publication = null
    stepBoundaries.upload = null

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
    publishMocks.createPost.mockReset()
    publishMocks.synchronizeCreatedPost.mockReset()
    publishMocks.synchronizeCreatedPost.mockResolvedValue(undefined)
    publishMocks.uploadCreatePostImages.mockReset()
    cropExportMocks.exportActiveImage.mockReset()
  })

  afterEach(async () => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => {
        root.unmount()
      })

      container.remove()
    })

    await act(async () => Promise.resolve())
    mountedRoots.length = 0
    vi.restoreAllMocks()
  })

  it('closes immediately without confirmation when there is no unsaved data', () => {
    const onCloseAction = vi.fn()
    const view = renderCreatePostFlow({ onCloseAction })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))

    expect(onCloseAction).toHaveBeenCalledTimes(1)
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('opens confirmation and does not close immediately when unsaved data exists', () => {
    const onCloseAction = vi.fn()
    const view = renderCreatePostFlow({
      initialState: createState({ hasUnsavedData: true }),
      onCloseAction,
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))

    expect(view.container.querySelector('[role="dialog"]')).toBeInstanceOf(HTMLElement)
    expect(onCloseAction).not.toHaveBeenCalled()
  })

  it('keeps the flow open when confirmation is canceled', () => {
    const onCloseAction = vi.fn()
    const view = renderCreatePostFlow({
      initialState: createState({ hasUnsavedData: true }),
      onCloseAction,
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))
    clickButton(getButton(view.container, 'Keep editing'))

    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
    expect(view.container.querySelector('[aria-label="Create post flow"]')).toBeInstanceOf(
      HTMLElement,
    )
    expect(onCloseAction).not.toHaveBeenCalled()
  })

  it('resets the flow and calls close when unsaved data is discarded', () => {
    const onCloseAction = vi.fn()
    const view = renderCreatePostFlow({
      initialState: createState({ hasUnsavedData: true }),
      onCloseAction,
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))
    clickButton(getButton(view.container, 'Discard'))

    expect(onCloseAction).toHaveBeenCalledTimes(1)
    expect(getHeaderTitle(view.container)).toBe('Add Photo')
  })

  it('does not expose next on upload when there are no images', () => {
    const view = renderCreatePostFlow({
      initialState: createState({ hasUnsavedData: true }),
    })

    mountedRoots.push(view)

    expect(queryButton(view.container, 'Next')).toBeNull()
  })

  it('disables publish on publication when image is not exported', () => {
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: 'image-1',
        images: [createImage()],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    expect(getButton(view.container, 'Publish').disabled).toBe(true)
  })

  it('enables publish on publication when image is exported', () => {
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: 'image-1',
        images: [createExportedImage()],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    expect(getButton(view.container, 'Publish').disabled).toBe(false)
  })

  it.each([
    [
      'not publication step',
      createState({
        activeImageId: 'image-1',
        images: [createExportedImage()],
        step: 'filters',
      }),
    ],
    [
      'no images',
      createState({
        images: [],
        step: 'publication',
      }),
    ],
    [
      'image is not exported',
      createState({
        activeImageId: 'image-1',
        images: [createImage()],
        step: 'publication',
      }),
    ],
    [
      'caption is longer than 500 characters',
      createState({
        activeImageId: 'image-1',
        caption: 'a'.repeat(501),
        images: [createExportedImage()],
        step: 'publication',
      }),
    ],
    [
      'publish is already in progress',
      createState({
        activeImageId: 'image-1',
        images: [createExportedImage()],
        isPublishing: true,
        step: 'publication',
      }),
    ],
  ])('does not call publish boundary when publish is disabled: %s', (_caseName, initialState) => {
    const onPublishAction = vi.fn()
    const view = renderCreatePostFlow({
      initialState,
      onPublishAction,
    })

    mountedRoots.push(view)

    const publishButton = queryButton(view.container, 'Publish')

    if (publishButton) {
      expect(publishButton.disabled).toBe(true)
      clickButton(publishButton)
    }

    expect(onPublishAction).not.toHaveBeenCalled()
  })

  it.each([
    ['upload', 'Add Photo'],
    ['crop', 'Cropping'],
    ['filters', 'Filters'],
    ['publication', 'Publication'],
  ] as const)('renders %s step title', (step, title) => {
    const image = createImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: step === 'upload' ? [] : [image],
        step,
      }),
    })

    mountedRoots.push(view)

    expect(getHeaderTitle(view.container)).toBe(title)
  })

  it('renders close and no next action for empty upload header', () => {
    const view = renderCreatePostFlow()

    mountedRoots.push(view)

    expect(queryButton(view.container, 'Close')).toBeInstanceOf(HTMLButtonElement)
    expect(queryButton(view.container, 'Next')).toBeNull()
  })

  it('renders back and next actions for crop step', () => {
    const image = createImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'crop',
      }),
    })

    mountedRoots.push(view)

    expect(queryButton(view.container, 'Back')).toBeInstanceOf(HTMLButtonElement)
    expect(queryButton(view.container, 'Next')).toBeInstanceOf(HTMLButtonElement)
  })

  it('disables back and next actions while publishing', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        isPublishing: true,
        step: 'crop',
      }),
    })

    mountedRoots.push(view)

    expect(getButton(view.container, 'Back').disabled).toBe(true)
    expect(getButton(view.container, 'Next').disabled).toBe(true)
  })

  it('does not go back while publishing', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        isPublishing: true,
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    const backButton = getButton(view.container, 'Back')

    enableButtonForProgrammaticClick(backButton)
    clickButton(backButton)

    expect(getHeaderTitle(view.container)).toBe('Publication')
    expect(stepBoundaries.publication?.isPublishing).toBe(true)
  })

  it('does not go next while publishing', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        isPublishing: true,
        step: 'crop',
      }),
    })

    mountedRoots.push(view)

    const nextButton = getButton(view.container, 'Next')

    enableButtonForProgrammaticClick(nextButton)
    clickButton(nextButton)

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.activeImage).toEqual(image)
  })

  it('renders publish action for publication step', () => {
    const image = createImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    expect(queryButton(view.container, 'Publish')).toBeInstanceOf(HTMLButtonElement)
  })

  it('passes upload data and callbacks to UploadStep', () => {
    const image = createImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
      }),
    })

    mountedRoots.push(view)

    expect(stepBoundaries.upload?.images).toEqual([image])
    expect(stepBoundaries.upload?.activeImageId).toBe(image.id)

    act(() => {
      stepBoundaries.upload?.onRemoveImage(image.id)
    })

    expect(stepBoundaries.upload?.images).toEqual([])
    expect(stepBoundaries.upload?.activeImageId).toBeNull()
  })

  it('revokes preview object URL when an image is removed from flow state', () => {
    const image = createImageWithPreview('image-with-preview', 'blob:image-with-preview')
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
      }),
    })

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.upload?.onRemoveImage(image.id)
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.previewUrl)
  })

  it('does not revoke removed preview object URL again on flow unmount', () => {
    const image = createImageWithPreview('image-with-preview', 'blob:image-with-preview')
    const view = renderCreatePostFlow()

    act(() => {
      stepBoundaries.upload?.onAddImages([image])
    })

    act(() => {
      stepBoundaries.upload?.onRemoveImage(image.id)
    })

    act(() => {
      view.root.unmount()
    })

    view.container.remove()

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.previewUrl)
  })

  it('revokes distinct preview, cropped, and final URLs when an image is removed', async () => {
    const cropped = { ...createExportedPayload(), objectUrl: 'blob:removed-cropped' }
    const exported = { ...createExportedPayload(), objectUrl: 'blob:removed-final' }
    const image = createImage({
      cropGeometry,
      cropped,
      exported,
      previewUrl: 'blob:removed-preview',
    })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })
    mountedRoots.push(view)

    act(() => stepBoundaries.crop?.onRemoveImage(image.id))
    await act(async () => Promise.resolve())

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(cropped.objectUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(exported.objectUrl)
  })

  it('revokes remaining preview object URLs on flow unmount', async () => {
    const firstImage = createImageWithPreview('first-image', 'blob:first-image')
    const secondImage = createImageWithPreview('second-image', 'blob:second-image')
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
      }),
    })

    act(() => {
      view.root.unmount()
    })

    view.container.remove()
    await act(async () => Promise.resolve())

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstImage.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(secondImage.previewUrl)
  })

  it('keeps current object URLs through StrictMode effect replay and revokes them on final unmount', async () => {
    const exportedImage = createExportedImage()
    const cropped = { ...createExportedPayload(), objectUrl: 'blob:strict-cropped' }
    const image = {
      ...exportedImage,
      cropped,
      previewUrl: 'blob:strict-original',
    }
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
      strictMode: true,
    })

    await act(async () => Promise.resolve())

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    act(() => view.root.unmount())
    view.container.remove()
    await act(async () => Promise.resolve())

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(cropped.objectUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.exported?.objectUrl)
  })

  it('uses newly owned object URLs when a new flow mounts after final cleanup', async () => {
    const firstImage = {
      ...createExportedImage(),
      previewUrl: 'blob:first-lifecycle-preview',
      exported: {
        ...createExportedPayload(),
        objectUrl: 'blob:first-lifecycle-export',
      },
    }
    const firstView = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage],
        step: 'crop',
      }),
    })

    act(() => firstView.root.unmount())
    firstView.container.remove()
    await act(async () => Promise.resolve())

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstImage.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstImage.exported.objectUrl)

    vi.mocked(URL.revokeObjectURL).mockClear()

    const secondImage = {
      ...createExportedImage(),
      id: 'image-2',
      previewUrl: 'blob:second-lifecycle-preview',
      exported: {
        ...createExportedPayload(),
        objectUrl: 'blob:second-lifecycle-export',
      },
    }
    const secondView = renderCreatePostFlow({
      initialState: createState({
        activeImageId: secondImage.id,
        images: [secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(secondView)

    await act(async () => Promise.resolve())

    expect(stepBoundaries.crop?.activeImage).toEqual(secondImage)
    expect(secondImage.previewUrl).not.toBe(firstImage.previewUrl)
    expect(secondImage.exported.objectUrl).not.toBe(firstImage.exported.objectUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('revokes preview and exported object URLs when the flow is reset', async () => {
    const cropped = { ...createExportedPayload(), objectUrl: 'blob:cropped-base' }
    const image = {
      ...createExportedImage(),
      cropped,
      previewUrl: 'blob:original-preview',
    }
    publishMocks.uploadCreatePostImages.mockResolvedValueOnce(['file-1'])
    publishMocks.createPost.mockResolvedValueOnce({})
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
    })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(cropped.objectUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.exported?.objectUrl)
  })

  it('does not revoke a cropped base when filter change clears the same final artifact', async () => {
    const cropped = { ...createExportedPayload(), objectUrl: 'blob:shared-crop-and-final' }
    const image = createImage({
      cropGeometry,
      cropped,
      exported: cropped,
    })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    act(() => stepBoundaries.filters?.onFilterChange(image.id, 'moon'))
    await act(async () => Promise.resolve())

    expect(stepBoundaries.filters?.activeImage?.cropped).toBe(cropped)
    expect(stepBoundaries.filters?.activeImage?.exported).toBeUndefined()
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(cropped.objectUrl)
  })

  it('does not revoke preview object URL when moving from upload to crop step', () => {
    const image = createImageWithPreview('image-with-preview', 'blob:image-with-preview')
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'upload',
      }),
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(getHeaderTitle(view.container)).toBe('Cropping')
  })

  it('does not pass backend or upload service dependencies to step components', () => {
    const image = createExportedImage()
    const publicationView = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
    })

    mountedRoots.push(publicationView)

    expectNoBackendIntegrationProps(
      stepBoundaries.publication as unknown as Record<string, unknown>,
    )

    act(() => {
      stepBoundaries.publication?.onCaptionChange('Caption from publication step')
    })
    clickButton(getButton(publicationView.container, 'Back'))
    expectNoBackendIntegrationProps(stepBoundaries.filters as unknown as Record<string, unknown>)

    clickButton(getButton(publicationView.container, 'Back'))
    expectNoBackendIntegrationProps(stepBoundaries.crop as unknown as Record<string, unknown>)

    clickButton(getButton(publicationView.container, 'Back'))
    expectNoBackendIntegrationProps(stepBoundaries.upload as unknown as Record<string, unknown>)
  })

  it('receives uploaded images from UploadStep through the shell boundary', () => {
    const image = createImage({ id: 'added-image' })
    const view = renderCreatePostFlow()

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.upload?.onAddImages([image])
    })

    expect(stepBoundaries.upload?.images).toEqual([image])
    expect(stepBoundaries.upload?.activeImageId).toBe(image.id)
  })

  it('passes active image and crop callbacks to CropStep', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'crop',
      }),
    })

    mountedRoots.push(view)

    expect(stepBoundaries.crop?.activeImage).toEqual(image)

    act(() => {
      stepBoundaries.crop?.onAspectRatioChange(image.id, '16:9')
    })

    expect(stepBoundaries.crop?.activeImage?.aspectRatio).toBe('16:9')
    expect(stepBoundaries.crop?.activeImage?.exported).toBeUndefined()

    act(() =>
      stepBoundaries.crop?.onCropGeometryChange(image.id, {
        ...cropGeometry,
        coordinates: { ...cropGeometry.coordinates!, left: 24 },
      }),
    )

    expect(stepBoundaries.crop?.activeImage?.exported).toBeUndefined()
  })

  it('exports images sequentially and enters Filters only after every image is exported', async () => {
    const firstImage = createImage({ id: 'image-1' })
    const secondImage = createImage({ aspectRatio: '4:5', id: 'image-2' })
    const firstExport = createExportedPayload()
    const secondExport = { ...createExportedPayload(), objectUrl: 'blob:edited-2' }

    cropExportMocks.exportActiveImage
      .mockResolvedValueOnce({
        cropped: firstExport,
        geometry: cropGeometry,
        imageId: firstImage.id,
        ratio: '1:1',
      })
      .mockResolvedValueOnce({
        cropped: secondExport,
        geometry: cropGeometry,
        imageId: secondImage.id,
        ratio: '4:5',
      })

    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.activeImage?.id).toBe(secondImage.id)
    expect(stepBoundaries.crop?.activeImage?.aspectRatio).toBe('4:5')
    expect(stepBoundaries.crop?.images[0]?.exported).toBe(firstExport)

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Filters')
    expect(stepBoundaries.filters?.activeImage?.id).toBe(secondImage.id)
    expect(cropExportMocks.exportActiveImage).toHaveBeenCalledTimes(2)
  })

  it('preserves crop geometry and cropped base through Filters back to Crop', async () => {
    const image = createImage()
    const cropped = createExportedPayload()
    cropExportMocks.exportActiveImage.mockResolvedValue({
      cropped,
      geometry: cropGeometry,
      imageId: image.id,
      ratio: image.aspectRatio,
    })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Filters')
    expect(stepBoundaries.filters?.activeImage).toEqual(
      expect.objectContaining({
        cropGeometry,
        cropped,
        exported: cropped,
        id: image.id,
      }),
    )

    clickButton(getButton(view.container, 'Back'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.activeImage).toEqual(
      expect.objectContaining({ cropGeometry, cropped, exported: cropped, id: image.id }),
    )

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Filters')
    expect(stepBoundaries.filters?.activeImage?.cropped).toBe(cropped)
    expect(stepBoundaries.filters?.activeImage?.exported).toBe(cropped)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(cropped.objectUrl)
  })

  it('returns to a previously exported image when its crop becomes dirty', async () => {
    const firstImage = createExportedImage()
    const secondImage = createImage({ id: 'image-2' })
    const secondExport = { ...createExportedPayload(), objectUrl: 'blob:edited-2' }
    cropExportMocks.exportActiveImage.mockResolvedValueOnce({
      cropped: secondExport,
      geometry: cropGeometry,
      imageId: secondImage.id,
      ratio: secondImage.aspectRatio,
    })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(view)

    act(() =>
      stepBoundaries.crop?.onCropGeometryChange(firstImage.id, {
        ...cropGeometry,
        coordinates: { ...cropGeometry.coordinates!, left: 24 },
      }),
    )
    act(() => stepBoundaries.crop?.onSetActiveImage(secondImage.id))
    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.activeImage?.id).toBe(firstImage.id)
    expect(
      stepBoundaries.crop?.images.find(({ id }) => id === firstImage.id)?.exported,
    ).toBeUndefined()
    expect(stepBoundaries.crop?.images.find(({ id }) => id === secondImage.id)?.exported).toBe(
      secondExport,
    )
  })

  it('blocks Back, Next, and CropStep controls while crop export is pending', async () => {
    const image = createImage()
    const deferred = createDeferred<CropExportResult>()
    cropExportMocks.exportActiveImage.mockReturnValueOnce(deferred.promise)
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))

    expect(getButton(view.container, 'Back').disabled).toBe(true)
    expect(getButton(view.container, 'Next').disabled).toBe(true)
    expect(stepBoundaries.crop?.disabled).toBe(true)

    const back = getButton(view.container, 'Back')
    const next = getButton(view.container, 'Next')
    enableButtonForProgrammaticClick(back)
    enableButtonForProgrammaticClick(next)
    clickButton(back)
    clickButton(next)

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(cropExportMocks.exportActiveImage).toHaveBeenCalledTimes(1)

    await act(async () => {
      deferred.resolve({
        cropped: createExportedPayload(),
        geometry: cropGeometry,
        imageId: image.id,
        ratio: image.aspectRatio,
      })
      await deferred.promise
    })
  })

  it('stays on Crop and shows an error when export fails', async () => {
    const image = createImage()
    cropExportMocks.exportActiveImage.mockRejectedValueOnce(new Error('Canvas export failed.'))
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Canvas export failed.',
    )
    expect(stepBoundaries.crop?.activeImage?.exported).toBeUndefined()
  })

  it('revokes a stale export when active image changes while export is pending', async () => {
    const firstImage = createImage({ id: 'image-1' })
    const secondImage = createImage({ id: 'image-2' })
    const deferred = createDeferred<CropExportResult>()
    const staleExport = { ...createExportedPayload(), objectUrl: 'blob:stale-crop' }
    cropExportMocks.exportActiveImage.mockReturnValueOnce(deferred.promise)
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))
    act(() => stepBoundaries.crop?.onSetActiveImage(secondImage.id))

    await act(async () => {
      deferred.resolve({
        cropped: staleExport,
        geometry: cropGeometry,
        imageId: firstImage.id,
        ratio: firstImage.aspectRatio,
      })
      await deferred.promise
    })

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.activeImage?.id).toBe(secondImage.id)
    expect(stepBoundaries.crop?.images[0]?.exported).toBeUndefined()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(staleExport.objectUrl)
  })

  it('ignores and revokes a pending export when the active image is removed', async () => {
    const firstImage = createImage({ id: 'image-1' })
    const secondImage = createImage({ aspectRatio: '4:5', id: 'image-2' })
    const deferred = createDeferred<CropExportResult>()
    const staleExport = { ...createExportedPayload(), objectUrl: 'blob:removed-image-crop' }
    cropExportMocks.exportActiveImage.mockReturnValueOnce(deferred.promise)
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))
    act(() => stepBoundaries.crop?.onRemoveImage(firstImage.id))

    await act(async () => {
      deferred.resolve({
        cropped: staleExport,
        geometry: cropGeometry,
        imageId: firstImage.id,
        ratio: firstImage.aspectRatio,
      })
      await deferred.promise
    })

    expect(stepBoundaries.crop?.activeImage?.id).toBe(secondImage.id)
    expect(stepBoundaries.crop?.activeImage?.aspectRatio).toBe('4:5')
    expect(stepBoundaries.crop?.images).toHaveLength(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(staleExport.objectUrl)
  })

  it('keeps only the latest export after a new image starts exporting', async () => {
    const firstImage = createImage({ id: 'image-1' })
    const secondImage = createImage({ id: 'image-2' })
    const firstDeferred = createDeferred<CropExportResult>()
    const latestDeferred = createDeferred<CropExportResult>()
    const staleExport = { ...createExportedPayload(), objectUrl: 'blob:stale-first-export' }
    const latestExport = { ...createExportedPayload(), objectUrl: 'blob:latest-second-export' }
    cropExportMocks.exportActiveImage
      .mockReturnValueOnce(firstDeferred.promise)
      .mockReturnValueOnce(latestDeferred.promise)
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'crop',
      }),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))
    act(() => stepBoundaries.crop?.onSetActiveImage(secondImage.id))
    clickButton(getButton(view.container, 'Next'))

    await act(async () => {
      latestDeferred.resolve({
        cropped: latestExport,
        geometry: cropGeometry,
        imageId: secondImage.id,
        ratio: secondImage.aspectRatio,
      })
      await latestDeferred.promise
    })
    await act(async () => {
      firstDeferred.resolve({
        cropped: staleExport,
        geometry: cropGeometry,
        imageId: firstImage.id,
        ratio: firstImage.aspectRatio,
      })
      await firstDeferred.promise
    })

    expect(stepBoundaries.crop?.images.find(({ id }) => id === secondImage.id)?.exported).toBe(
      latestExport,
    )
    expect(
      stepBoundaries.crop?.images.find(({ id }) => id === firstImage.id)?.exported,
    ).toBeUndefined()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(staleExport.objectUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(latestExport.objectUrl)
  })

  it('revokes an uncommitted export that resolves after flow unmount', async () => {
    const image = createImage()
    const deferred = createDeferred<CropExportResult>()
    const staleExport = { ...createExportedPayload(), objectUrl: 'blob:unmounted-crop' }
    cropExportMocks.exportActiveImage.mockReturnValueOnce(deferred.promise)
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })

    clickButton(getButton(view.container, 'Next'))
    act(() => view.root.unmount())
    view.container.remove()

    await act(async () => {
      deferred.resolve({
        cropped: staleExport,
        geometry: cropGeometry,
        imageId: image.id,
        ratio: image.aspectRatio,
      })
      await deferred.promise
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(staleExport.objectUrl)
  })

  it('revokes the previous exported object URL when it is replaced', () => {
    const image = createExportedImage()
    const replacement = { ...createExportedPayload(), objectUrl: 'blob:replacement' }
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    act(() => stepBoundaries.filters?.onImageExported(image.id, replacement))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image.exported?.objectUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(replacement.objectUrl)
  })

  it('revokes stale cropped and final URLs when a changed crop is committed', async () => {
    const previousCropped = { ...createExportedPayload(), objectUrl: 'blob:previous-cropped' }
    const previousFinal = { ...createExportedPayload(), objectUrl: 'blob:previous-final' }
    const nextCropped = { ...createExportedPayload(), objectUrl: 'blob:next-cropped' }
    const image = createImage({
      cropGeometry,
      cropped: previousCropped,
      exported: previousFinal,
    })
    cropExportMocks.exportActiveImage.mockResolvedValueOnce({
      cropped: nextCropped,
      geometry: {
        ...cropGeometry,
        coordinates: { ...cropGeometry.coordinates!, left: 24 },
      },
      imageId: image.id,
      ratio: image.aspectRatio,
    })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'crop' }),
    })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(previousCropped.objectUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(previousFinal.objectUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(nextCropped.objectUrl)
  })

  it('passes active image and filter callbacks to FiltersStep', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'filters',
      }),
    })

    mountedRoots.push(view)

    expect(stepBoundaries.filters?.activeImage).toEqual(image)

    act(() => {
      stepBoundaries.filters?.onFilterChange(image.id, 'moon')
    })

    expect(stepBoundaries.filters?.activeImage?.filter).toBe('moon')
    expect(stepBoundaries.filters?.activeImage?.exported).toBeUndefined()

    const exported = createExportedPayload()

    act(() => {
      stepBoundaries.filters?.onImageExported(image.id, exported)
    })

    expect(stepBoundaries.filters?.activeImage?.exported).toBe(exported)
  })

  it('disables Filters Next while the selected final export is missing or pending', () => {
    const cropped = createExportedPayload()
    const image = createImage({ cropped, exported: undefined, filter: 'moon' })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    expect(getButton(view.container, 'Next').disabled).toBe(true)

    act(() => stepBoundaries.filters?.onExportingChange(true))
    act(() => stepBoundaries.filters?.onImageExported(image.id, createExportedPayload()))

    expect(getButton(view.container, 'Next').disabled).toBe(true)

    act(() => stepBoundaries.filters?.onExportingChange(false))

    expect(getButton(view.container, 'Next').disabled).toBe(false)
  })

  it('allows Back while a filter export is pending', () => {
    const cropped = createExportedPayload()
    const image = createImage({ cropped, exported: undefined, filter: 'moon' })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    act(() => stepBoundaries.filters?.onExportingChange(true))
    clickButton(getButton(view.container, 'Back'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
  })

  it('preserves a filtered export through Filters to Crop and back', async () => {
    const cropped = createExportedPayload()
    const filtered = { ...createExportedPayload(), objectUrl: 'blob:filtered-moon' }
    const image = createImage({
      cropGeometry,
      cropped,
      exported: filtered,
      filter: 'moon',
    })
    cropExportMocks.exportActiveImage.mockResolvedValueOnce({
      cropped,
      geometry: cropGeometry,
      imageId: image.id,
      ratio: image.aspectRatio,
    })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Back'))
    await clickButtonAndFlush(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Filters')
    expect(stepBoundaries.filters?.activeImage).toEqual(
      expect.objectContaining({ cropped, exported: filtered, filter: 'moon' }),
    )
  })

  it('reuses cropped as final and cleans up the previous filter export when Normal is selected', async () => {
    const cropped = { ...createExportedPayload(), objectUrl: 'blob:normal-cropped' }
    const filtered = { ...createExportedPayload(), objectUrl: 'blob:previous-filtered' }
    const image = createImage({ cropped, exported: filtered, filter: 'moon' })
    const view = renderCreatePostFlow({
      initialState: createState({ activeImageId: image.id, images: [image], step: 'filters' }),
    })
    mountedRoots.push(view)

    act(() => stepBoundaries.filters?.onFilterChange(image.id, 'normal'))
    act(() => stepBoundaries.filters?.onImageExported(image.id, cropped))
    await act(async () => Promise.resolve())

    expect(stepBoundaries.filters?.activeImage?.cropped).toBe(cropped)
    expect(stepBoundaries.filters?.activeImage?.exported).toBe(cropped)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(filtered.objectUrl)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(cropped.objectUrl)
  })

  it('passes publication data and caption callback to PublicationStep', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        caption: 'Initial caption',
        images: [image],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    expect(stepBoundaries.publication?.images).toEqual([image])
    expect(stepBoundaries.publication?.caption).toBe('Initial caption')
    expect(stepBoundaries.publication?.isPublishing).toBe(false)
    expect(stepBoundaries.publication?.onRetryUpload).toEqual(expect.any(Function))

    act(() => {
      stepBoundaries.publication?.onCaptionChange('Updated caption')
    })

    expect(stepBoundaries.publication?.caption).toBe('Updated caption')
  })

  it('calls publish boundary without backend integration', async () => {
    const onPublishAction = vi.fn()
    const image = createExportedImage()
    const initialState = createState({
      activeImageId: image.id,
      caption: 'Ready to publish',
      images: [image],
      step: 'publication',
    })
    const view = renderCreatePostFlow({
      initialState,
      onPublishAction,
    })

    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(onPublishAction).toHaveBeenCalledWith(initialState)
  })

  it('passes the current CreatePostState to publish boundary', async () => {
    const onPublishAction = vi.fn()
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        caption: 'Initial caption',
        images: [image],
        step: 'publication',
      }),
      onPublishAction,
    })

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.publication?.onCaptionChange('Updated before publish')
    })
    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(onPublishAction).toHaveBeenCalledWith(
      expect.objectContaining({
        activeImageId: image.id,
        caption: 'Updated before publish',
        images: [image],
        isPublishing: false,
        step: 'publication',
      }),
    )
  })

  it('locks the visible caption snapshot and duplicate publish while publishing', async () => {
    const uploadReady = createDeferred<string[]>()
    const image = createExportedImage()
    const initialState = createState({
      activeImageId: image.id,
      caption: 'Visible caption',
      images: [image],
      step: 'publication',
    })

    publishMocks.uploadCreatePostImages.mockReturnValueOnce(uploadReady.promise)
    publishMocks.createPost.mockResolvedValueOnce({})

    const view = renderCreatePostFlow({ initialState })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(stepBoundaries.publication?.isPublishing).toBe(true)

    act(() => stepBoundaries.publication?.onCaptionChange('Late caption'))

    expect(stepBoundaries.publication?.caption).toBe('Visible caption')

    const publishButton = getButton(view.container, 'Publish')

    expect(publishButton.disabled).toBe(true)
    enableButtonForProgrammaticClick(publishButton)
    clickButton(publishButton)

    expect(publishMocks.uploadCreatePostImages).toHaveBeenCalledTimes(1)

    await act(async () => {
      uploadReady.resolve(['file-1'])
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(publishMocks.createPost).toHaveBeenCalledWith({
      description: 'Visible caption',
      fileIds: ['file-1'],
    })
  })

  it('retries publish through the publication boundary', async () => {
    const onPublishAction = vi.fn()
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
      onPublishAction,
    })

    mountedRoots.push(view)

    await act(async () => {
      await stepBoundaries.publication?.onRetryUpload()
    })

    expect(onPublishAction).toHaveBeenCalledTimes(1)
  })

  it('clears failed upload error when retry moves upload through uploading to ready', async () => {
    const uploadReady = createDeferred()
    const createPostReady = createDeferred<unknown>()
    const image = createExportedImage()
    const failedImage: CreatePostImage = {
      ...image,
      upload: {
        error: 'Storage upload failed.',
        fileId: 'stale-file',
        status: 'failed',
      },
    }
    let retryResult: Promise<void> | void

    publishMocks.uploadCreatePostImages.mockImplementationOnce(
      async (
        _state: CreatePostState,
        { dispatch }: { dispatch?: (action: CreatePostAction) => void },
      ) => {
        dispatch?.({
          patches: [{ imageId: image.id, status: 'uploading' }],
          type: 'applyUploadBatchState',
        })

        await uploadReady.promise

        dispatch?.({
          patches: [{ fileId: 'file-1', imageId: image.id, status: 'ready' }],
          type: 'applyUploadBatchState',
        })

        return ['file-1']
      },
    )
    publishMocks.createPost.mockReturnValueOnce(createPostReady.promise)

    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [failedImage],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    expect(stepBoundaries.publication?.images[0]?.upload).toEqual({
      error: 'Storage upload failed.',
      fileId: 'stale-file',
      status: 'failed',
    })

    await act(async () => {
      retryResult = stepBoundaries.publication?.onRetryUpload()
      await Promise.resolve()
    })

    expect(stepBoundaries.publication?.images[0]?.upload).toEqual({
      fileId: 'stale-file',
      status: 'uploading',
    })

    await act(async () => {
      uploadReady.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(stepBoundaries.publication?.images[0]?.upload).toEqual({
      fileId: 'file-1',
      status: 'ready',
    })

    await act(async () => {
      createPostReady.resolve({})
      await retryResult
    })
  })

  it('does not retry publish while publishing is already in progress', async () => {
    const onPublishAction = vi.fn()
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        isPublishing: true,
        step: 'publication',
      }),
      onPublishAction,
    })

    mountedRoots.push(view)

    await act(async () => {
      await stepBoundaries.publication?.onRetryUpload()
    })

    expect(onPublishAction).not.toHaveBeenCalled()
  })

  it('uploads images and creates post with ordered file ids by default', async () => {
    const onCloseAction = vi.fn()
    const image = createExportedImage()
    const initialState = createState({
      activeImageId: image.id,
      caption: 'Ready to publish',
      images: [image],
      step: 'publication',
    })

    publishMocks.uploadCreatePostImages.mockResolvedValueOnce(['file-1'])
    publishMocks.createPost.mockResolvedValueOnce({
      id: 'post-1',
      ownerId: 'user-1',
      description: 'Ready to publish',
      attachments: [],
      author: {
        displayName: 'Backend Author',
        id: 'user-1',
        profilePictureFileId: null,
        username: 'backend_author',
      },
      createdAt: '2026-07-04T12:00:00.000Z',
      updatedAt: '2026-07-04T12:00:00.000Z',
    })

    const view = renderCreatePostFlow({
      initialState,
      onCloseAction,
    })

    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(publishMocks.uploadCreatePostImages).toHaveBeenCalledWith(
      initialState,
      expect.objectContaining({
        dispatch: expect.any(Function),
      }),
    )
    expect(publishMocks.createPost).toHaveBeenCalledWith({
      description: 'Ready to publish',
      fileIds: ['file-1'],
    })
    expect(publishMocks.synchronizeCreatedPost).toHaveBeenCalledWith('post-1', 'user-1')
    expect(publishMocks.synchronizeCreatedPost).toHaveBeenCalledTimes(1)
    expect(getHeaderTitle(view.container)).toBe('Add Photo')
    expect(onCloseAction).toHaveBeenCalledTimes(1)
  })

  it('closes as published when post-create synchronization rejects', async () => {
    const synchronizationError = new Error('Feed synchronization failed.')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onCloseAction = vi.fn()
    const image = createExportedImage()

    publishMocks.uploadCreatePostImages.mockResolvedValueOnce(['file-1'])
    publishMocks.createPost.mockResolvedValueOnce({
      id: 'post-1',
      ownerId: 'user-1',
      description: null,
      attachments: [],
      author: {
        displayName: 'Backend Author',
        id: 'user-1',
        profilePictureFileId: null,
        username: 'backend_author',
      },
      createdAt: '2026-07-04T12:00:00.000Z',
      updatedAt: '2026-07-04T12:00:00.000Z',
    })
    publishMocks.synchronizeCreatedPost.mockRejectedValueOnce(synchronizationError)

    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
      onCloseAction,
    })

    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(publishMocks.uploadCreatePostImages).toHaveBeenCalledTimes(1)
    expect(publishMocks.createPost).toHaveBeenCalledTimes(1)
    expect(publishMocks.synchronizeCreatedPost).toHaveBeenCalledWith('post-1', 'user-1')
    expect(publishMocks.synchronizeCreatedPost).toHaveBeenCalledTimes(1)
    expect(onCloseAction).toHaveBeenCalledTimes(1)
    expect(view.container.querySelector('[role="alert"]')).toBeNull()
    expect(queryButton(view.container, 'Publish')).toBeNull()
    expect(getHeaderTitle(view.container)).toBe('Add Photo')
    expect(consoleError).toHaveBeenCalledWith(
      '[CreatePost] unexpected post-create synchronization failure',
      {
        postId: 'post-1',
        reason: synchronizationError,
      },
    )
  })

  it('keeps the flow open and skips synchronization when createPost fails', async () => {
    const onCloseAction = vi.fn()
    const image = createExportedImage()

    publishMocks.uploadCreatePostImages.mockResolvedValueOnce(['file-1'])
    publishMocks.createPost.mockRejectedValueOnce(new Error('Post creation failed.'))

    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
      onCloseAction,
    })

    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Post creation failed.',
    )
    expect(stepBoundaries.publication?.isPublishing).toBe(false)
    expect(publishMocks.synchronizeCreatedPost).not.toHaveBeenCalled()
    expect(onCloseAction).not.toHaveBeenCalled()
  })

  it('shows publish error when default publish fails', async () => {
    const image = createExportedImage()

    publishMocks.uploadCreatePostImages.mockRejectedValueOnce(new Error('Storage upload failed.'))

    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'publication',
      }),
    })

    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Publish'))

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Storage upload failed.',
    )
    expect(publishMocks.createPost).not.toHaveBeenCalled()
    expect(publishMocks.synchronizeCreatedPost).not.toHaveBeenCalled()
  })
})
