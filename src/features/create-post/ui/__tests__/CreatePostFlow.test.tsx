import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPostInitialState,
  type AspectRatio,
  type CreatePostAction,
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
  nextExportRequestId: number
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onNextExportFailed: () => void
  onNextImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

type FiltersStepBoundaryProps = {
  activeImage: CreatePostImage | null
  onFilterBaseChange: (imageId: string, filterBase: CreatePostImage['filterBase']) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onFilterExportingChange: (imageId: string, isExporting: boolean) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
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
  uploadCreatePostImages: vi.fn(),
}))

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

    return <section aria-label="Cropping">Crop boundary</section>
  },
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

function createExportedImage({
  id = 'image-1',
  objectUrl = 'blob:edited',
}: {
  id?: string
  objectUrl?: string
} = {}): CreatePostImage {
  const file = new File(['edited'], 'edited.jpg', { type: 'image/jpeg' })

  return createImage({
    id,
    exported: {
      file,
      objectUrl,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    },
  })
}

function createExportedPayload(
  objectUrl = 'blob:edited',
): NonNullable<CreatePostImage['exported']> {
  const file = new File(['edited'], 'edited.jpg', { type: 'image/jpeg' })

  return {
    file,
    objectUrl,
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
}: {
  initialState?: CreatePostState
  onCloseAction?: () => void
  onPublishAction?: (state: CreatePostState) => Promise<void> | void
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <CreatePostFlow
        initialState={initialState}
        onCloseAction={onCloseAction}
        onPublishAction={onPublishAction}
      />,
    )
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
    publishMocks.uploadCreatePostImages.mockReset()
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => {
        root.unmount()
      })

      container.remove()
    })

    mountedRoots.length = 0
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
    [
      'filter export is still pending',
      createState({
        activeImageId: 'image-1',
        images: [createExportedImage()],
        pendingFilterExportImageIds: ['image-1'],
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

  it('keeps user on filters while filter export is pending', () => {
    const image = createExportedImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'filters',
      }),
    })

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.filters?.onFilterExportingChange(image.id, true)
    })

    const nextButton = getButton(view.container, 'Next')
    const backButton = getButton(view.container, 'Back')

    expect(nextButton.disabled).toBe(true)
    expect(backButton.disabled).toBe(true)
    clickButton(nextButton)
    clickButton(backButton)
    expect(getHeaderTitle(view.container)).toBe('Filters')

    act(() => {
      stepBoundaries.filters?.onFilterExportingChange(image.id, false)
    })

    expect(getButton(view.container, 'Next').disabled).toBe(false)
    expect(getButton(view.container, 'Back').disabled).toBe(false)
  })

  it('keeps user on filters until every image has a final export', () => {
    const firstImage = createExportedImage({ id: 'image-1' })
    const secondImage = createImage({ id: 'image-2' })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
        step: 'filters',
      }),
    })

    mountedRoots.push(view)

    const nextButton = getButton(view.container, 'Next')

    expect(nextButton.disabled).toBe(true)
    clickButton(nextButton)
    expect(getHeaderTitle(view.container)).toBe('Filters')
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

  it('revokes remaining preview object URLs on flow unmount', () => {
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

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstImage.previewUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(secondImage.previewUrl)
  })

  it('revokes stale exported object URLs when filters are changed repeatedly', () => {
    const image = createExportedImage({ objectUrl: 'blob:filtered-initial' })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'filters',
      }),
    })

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.filters?.onFilterChange(image.id, 'moon')
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:filtered-initial')

    act(() => {
      stepBoundaries.filters?.onImageExported(image.id, createExportedPayload('blob:filtered-moon'))
    })

    act(() => {
      stepBoundaries.filters?.onFilterChange(image.id, 'lark')
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:filtered-moon')
  })

  it('revokes previous exported object URL when exported file is replaced', () => {
    const image = createExportedImage({ objectUrl: 'blob:exported-before' })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'filters',
      }),
    })

    mountedRoots.push(view)

    act(() => {
      stepBoundaries.filters?.onImageExported(
        image.id,
        createExportedPayload('blob:exported-after'),
      )
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:exported-before')
  })

  it('revokes exported object URL when an image is removed from flow state', () => {
    const image = createExportedImage({ objectUrl: 'blob:removed-export' })
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

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:removed-export')
  })

  it('revokes exported object URL when the flow is reset', () => {
    const image = createExportedImage({ objectUrl: 'blob:reset-export' })
    const onCloseAction = vi.fn()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        hasUnsavedData: true,
        images: [image],
      }),
      onCloseAction,
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))
    clickButton(getButton(view.container, 'Discard'))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reset-export')
  })

  it('revokes remaining exported object URLs on flow unmount', () => {
    const image = createExportedImage({ objectUrl: 'blob:unmount-export' })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
      }),
    })

    act(() => {
      view.root.unmount()
    })

    view.container.remove()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:unmount-export')
  })

  it('does not revoke the same exported object URL twice', () => {
    const sharedObjectUrl = 'blob:shared-export'
    const firstImage = createExportedImage({ id: 'first-image', objectUrl: sharedObjectUrl })
    const secondImage = createExportedImage({ id: 'second-image', objectUrl: sharedObjectUrl })
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: firstImage.id,
        images: [firstImage, secondImage],
      }),
    })

    act(() => {
      stepBoundaries.upload?.onRemoveImage(firstImage.id)
    })

    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(sharedObjectUrl)

    act(() => {
      view.root.unmount()
    })

    view.container.remove()

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(sharedObjectUrl)
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

    const exported = createExportedPayload()

    act(() => {
      stepBoundaries.crop?.onImageExported(image.id, exported)
    })

    expect(stepBoundaries.crop?.activeImage?.exported).toBe(exported)
  })

  it('exports the current crop before moving to filters', () => {
    const image = createImage()
    const view = renderCreatePostFlow({
      initialState: createState({
        activeImageId: image.id,
        images: [image],
        step: 'crop',
      }),
    })

    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Next'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')
    expect(stepBoundaries.crop?.nextExportRequestId).toBe(1)
    expect(getButton(view.container, 'Next').disabled).toBe(true)
    expect(getButton(view.container, 'Back').disabled).toBe(true)

    clickButton(getButton(view.container, 'Back'))

    expect(getHeaderTitle(view.container)).toBe('Cropping')

    const exported = createExportedPayload('blob:cropped-before-filters')

    act(() => {
      stepBoundaries.crop?.onNextImageExported(image.id, exported)
    })

    expect(getHeaderTitle(view.container)).toBe('Filters')
    expect(stepBoundaries.filters?.activeImage?.exported).toBe(exported)
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
      stepBoundaries.filters?.onFilterBaseChange(image.id, image.exported)
      stepBoundaries.filters?.onFilterChange(image.id, 'moon')
    })

    expect(stepBoundaries.filters?.activeImage?.filter).toBe('moon')
    expect(stepBoundaries.filters?.activeImage?.filterBase).toBe(image.exported)
    expect(stepBoundaries.filters?.activeImage?.exported).toBeUndefined()

    const exported = createExportedPayload()

    act(() => {
      stepBoundaries.filters?.onImageExported(image.id, exported)
    })

    expect(stepBoundaries.filters?.activeImage?.exported).toBe(exported)
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
    expect(onCloseAction).toHaveBeenCalledTimes(1)
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
  })
})
