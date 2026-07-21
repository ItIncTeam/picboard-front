import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatePostImage } from '@/features/create-post'

import { UploadStep, type UploadStepProps } from '../UploadStep'

vi.mock('@/shared/assets', () => ({
  Close: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
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

vi.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

type UploadStepRenderResult = RenderResult & {
  onAddImages: ReturnType<typeof vi.fn>
  onRemoveImage: ReturnType<typeof vi.fn>
  onSetActiveImage: ReturnType<typeof vi.fn>
}

function createImage(overrides: Partial<CreatePostImage> = {}): CreatePostImage {
  return {
    id: 'image-1',
    name: 'first.jpg',
    aspectRatio: 'original',
    filter: 'normal',
    previewUrl: 'blob:first.jpg',
    ...overrides,
  }
}

function createFile(name: string, type: string, size?: number): File {
  const file = new File(['content'], name, { type })

  if (size !== undefined) {
    Object.defineProperty(file, 'size', {
      configurable: true,
      value: size,
    })
  }

  return file
}

function renderUploadStep(props: Partial<UploadStepProps> = {}): UploadStepRenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)
  const onAddImages = vi.fn()
  const onRemoveImage = vi.fn()
  const onSetActiveImage = vi.fn()

  document.body.append(container)

  act(() => {
    root.render(
      <UploadStep
        activeImageId={props.activeImageId ?? null}
        images={props.images ?? []}
        onAddImages={props.onAddImages ?? onAddImages}
        onRemoveImage={props.onRemoveImage ?? onRemoveImage}
        onSetActiveImage={props.onSetActiveImage ?? onSetActiveImage}
      />,
    )
  })

  return { container, onAddImages, onRemoveImage, onSetActiveImage, root }
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected file input.')
  }

  return input
}

function changeInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  })

  act(() => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function dropFiles(container: HTMLElement, files: File[]) {
  const dropEvent = new Event('drop', { bubbles: true, cancelable: true })

  Object.defineProperty(dropEvent, 'dataTransfer', {
    configurable: true,
    value: {
      files,
    },
  })

  act(() => {
    container.querySelector('[aria-label="Upload photo"]')?.dispatchEvent(dropEvent)
  })
}

function clickButton(container: HTMLElement, name: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent === name || item.getAttribute('aria-label') === name,
  )

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected button "${name}".`)
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('UploadStep', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
      writable: true,
    })
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => {
        root.unmount()
      })

      container.remove()
    })

    mountedRoots.length = 0
    vi.restoreAllMocks()
  })

  it('adds a selected JPEG image with preview data', () => {
    const view = renderUploadStep()
    const file = createFile('photo.jpg', 'image/jpeg')

    mountedRoots.push(view)

    changeInputFiles(getFileInput(view.container), [file])

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(view.onAddImages).toHaveBeenCalledWith([
      expect.objectContaining({
        aspectRatio: 'original',
        file,
        fileInfo: {
          lastModified: file.lastModified,
          name: file.name,
          size: file.size,
          type: file.type,
        },
        filter: 'normal',
        name: file.name,
        previewUrl: 'blob:photo.jpg',
      }),
    ])
    expect(view.onAddImages.mock.calls[0][0][0].id).toEqual(expect.any(String))
  })

  it('adds a dropped PNG image through the same upload pipeline', () => {
    const view = renderUploadStep()
    const file = createFile('photo.png', 'image/png')

    mountedRoots.push(view)

    dropFiles(view.container, [file])

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(view.onAddImages).toHaveBeenCalledWith([
      expect.objectContaining({
        file,
        name: file.name,
        previewUrl: 'blob:photo.png',
      }),
    ])
  })

  it('shows an error for unsupported image type', () => {
    const view = renderUploadStep()
    const file = createFile('animation.gif', 'image/gif')

    mountedRoots.push(view)

    changeInputFiles(getFileInput(view.container), [file])

    expect(view.onAddImages).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain('animation.gif must be JPEG or PNG.')
  })

  it('shows an error for image larger than 20 MB', () => {
    const view = renderUploadStep()
    const file = createFile('large.jpg', 'image/jpeg', 20 * 1024 * 1024 + 1)

    mountedRoots.push(view)

    changeInputFiles(getFileInput(view.container), [file])

    expect(view.onAddImages).not.toHaveBeenCalled()
    expect(view.container.textContent).toContain('large.jpg must be 20 MB or smaller.')
  })

  it('limits added images to the remaining slots and shows an error', () => {
    const existingImages = Array.from({ length: 9 }, (_, index) =>
      createImage({
        id: `existing-${index}`,
        name: `existing-${index}.jpg`,
        previewUrl: `blob:existing-${index}`,
      }),
    )
    const view = renderUploadStep({ images: existingImages })
    const firstFile = createFile('first.jpg', 'image/jpeg')
    const secondFile = createFile('second.jpg', 'image/jpeg')

    mountedRoots.push(view)

    changeInputFiles(getFileInput(view.container), [firstFile, secondFile])

    expect(view.onAddImages).toHaveBeenCalledWith([
      expect.objectContaining({
        file: firstFile,
        name: firstFile.name,
      }),
    ])
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(view.container.textContent).toContain('Only 1 more photo can be added.')
  })

  it('disables file selection when the image limit is reached', () => {
    const existingImages = Array.from({ length: 10 }, (_, index) =>
      createImage({
        id: `existing-${index}`,
        name: `existing-${index}.jpg`,
        previewUrl: `blob:existing-${index}`,
      }),
    )
    const view = renderUploadStep({ images: existingImages })
    const selectButton = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Select from Computer',
    )

    mountedRoots.push(view)

    expect(selectButton).toBeInstanceOf(HTMLButtonElement)
    expect((selectButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('calls remove callback with image id', () => {
    const image = createImage({
      id: 'image-to-remove',
      name: 'removable.jpg',
      previewUrl: 'blob:removable',
    })
    const view = renderUploadStep({
      activeImageId: image.id,
      images: [image],
    })

    mountedRoots.push(view)

    clickButton(view.container, 'Remove removable.jpg')

    expect(view.onRemoveImage).toHaveBeenCalledWith(image.id)
  })

  it('calls active image callback with image id', () => {
    const image = createImage({
      id: 'image-to-select',
      name: 'selectable.jpg',
      previewUrl: 'blob:selectable',
    })
    const view = renderUploadStep({
      images: [image],
    })

    mountedRoots.push(view)

    clickButton(view.container, 'Select image 1: selectable.jpg')

    expect(view.onSetActiveImage).toHaveBeenCalledWith(image.id)
  })

  it('labels active preview and selected photos gallery', () => {
    const images = [
      createImage({ id: 'first', name: 'first.jpg', previewUrl: 'blob:first' }),
      createImage({ id: 'second', name: 'second.jpg', previewUrl: 'blob:second' }),
      createImage({ id: 'third', name: 'third.jpg', previewUrl: 'blob:third' }),
    ]
    const view = renderUploadStep({
      activeImageId: 'first',
      images,
    })

    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Selected photo')
    expect(view.container.textContent).toContain('Selected photos')
    expect(view.container.textContent).toContain('3 photos selected')
    expect(
      view.container.querySelector('[aria-label="Upload photo"]')?.getAttribute('data-has-images'),
    ).toBe('true')
  })

  it('marks the active thumbnail', () => {
    const activeImage = createImage({
      id: 'active',
      name: 'active.jpg',
      previewUrl: 'blob:active',
    })
    const inactiveImage = createImage({
      id: 'inactive',
      name: 'inactive.jpg',
      previewUrl: 'blob:inactive',
    })
    const view = renderUploadStep({
      activeImageId: activeImage.id,
      images: [activeImage, inactiveImage],
    })

    mountedRoots.push(view)

    const activeButton = view.container.querySelector('[aria-label="Select image 1: active.jpg"]')
    const inactiveButton = view.container.querySelector(
      '[aria-label="Select image 2: inactive.jpg"]',
    )

    expect(activeButton?.closest('li')?.getAttribute('data-active')).toBe('true')
    expect(inactiveButton?.closest('li')?.getAttribute('data-active')).toBe('false')
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true')
    expect(inactiveButton?.getAttribute('aria-pressed')).toBe('false')
  })
})
