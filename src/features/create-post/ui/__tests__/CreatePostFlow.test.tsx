import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPostInitialState,
  type AspectRatio,
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
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

type FiltersStepBoundaryProps = {
  activeImage: CreatePostImage | null
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

type PublicationStepBoundaryProps = {
  caption: string
  images: CreatePostImage[]
  onCaptionChange: (caption: string) => void
}

const stepBoundaries = vi.hoisted(() => ({
  crop: null as CropStepBoundaryProps | null,
  filters: null as FiltersStepBoundaryProps | null,
  publication: null as PublicationStepBoundaryProps | null,
  upload: null as UploadStepBoundaryProps | null,
}))

vi.mock('@/shared/assets', () => ({
  ArrowBackIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  Close: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
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
}: {
  initialState?: CreatePostState
  onCloseAction?: () => void
  onPublishAction?: (state: CreatePostState) => void
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

    act(() => {
      stepBoundaries.publication?.onCaptionChange('Updated caption')
    })

    expect(stepBoundaries.publication?.caption).toBe('Updated caption')
  })

  it('calls publish boundary without backend integration', () => {
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

    clickButton(getButton(view.container, 'Publish'))

    expect(onPublishAction).toHaveBeenCalledWith(initialState)
  })

  it('passes the current CreatePostState to publish boundary', () => {
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
    clickButton(getButton(view.container, 'Publish'))

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
})
