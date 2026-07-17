import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatePostImage } from '@/features/create-post'
import { CREATE_POST_CAPTION_MAX_LENGTH } from '@/features/create-post/lib/createPostConstants'

import { PublicationStep, type PublicationStepProps } from '../PublicationStep'

vi.mock('@/shared/assets', () => ({
  ArrowBackIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ArrowNextIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  Dot: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
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
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createExportedImage(id: string): CreatePostImage {
  return {
    id,
    name: `${id}.jpg`,
    aspectRatio: 'original',
    filter: 'normal',
    previewUrl: `blob:${id}`,
    exported: {
      file: new File(['mock'], `${id}-exported.jpg`, { type: 'image/jpeg' }),
      objectUrl: `blob:${id}-exported`,
      fileInfo: {
        name: `${id}-exported.jpg`,
        size: 120_000,
        type: 'image/jpeg',
        lastModified: 1_700_000_000_000,
      },
    },
  }
}

function createImageWithoutExport(id: string): CreatePostImage {
  return {
    id,
    name: `${id}.jpg`,
    aspectRatio: 'original',
    filter: 'normal',
    previewUrl: `blob:${id}`,
  }
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(textarea)
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  valueSetter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
}

function renderPublicationStep(props: Partial<PublicationStepProps> = {}): RenderResult & {
  onCaptionChange: ReturnType<typeof vi.fn>
} {
  const container = document.createElement('div')
  const root = createRoot(container)
  const onCaptionChange = vi.fn()

  document.body.append(container)

  act(() => {
    root.render(
      <PublicationStep
        caption={props.caption ?? ''}
        images={props.images ?? [createExportedImage('image-1')]}
        onCaptionChange={onCaptionChange}
      />,
    )
  })

  return { container, onCaptionChange, root }
}

describe('PublicationStep', () => {
  const mountedRoots: Root[] = []

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    while (mountedRoots.length > 0) {
      const root = mountedRoots.pop()

      act(() => {
        root?.unmount()
      })
    }

    document.body.replaceChildren()
  })

  it('renders exported image preview and caption field', () => {
    const view = renderPublicationStep({
      caption: 'Initial caption',
      images: [createExportedImage('image-1')],
    })

    mountedRoots.push(view.root)

    const previewImage = view.container.querySelector('img[alt="image-1.jpg"]')

    expect(previewImage).not.toBeNull()
    expect(previewImage?.getAttribute('src')).toBe('blob:image-1-exported')
    expect(view.container.querySelector('textarea')?.value).toBe('Initial caption')
    expect(view.container.textContent).toContain(
      `${'Initial caption'.length}/${CREATE_POST_CAPTION_MAX_LENGTH}`,
    )
  })

  it('shows placeholder instead of original preview when exported image is missing', () => {
    const view = renderPublicationStep({
      images: [createImageWithoutExport('image-1')],
    })

    mountedRoots.push(view.root)

    expect(view.container.querySelector('img')).toBeNull()
    expect(view.container.textContent).toContain('Final preview is not ready')
    expect(view.container.textContent).not.toContain('blob:image-1')
  })

  it('calls onCaptionChange when description is edited', () => {
    const view = renderPublicationStep()

    mountedRoots.push(view.root)

    const textarea = view.container.querySelector('textarea')

    expect(textarea).not.toBeNull()

    act(() => {
      if (textarea) {
        setTextareaValue(textarea, 'Updated caption')
      }
    })

    expect(view.onCaptionChange).toHaveBeenCalledWith('Updated caption')
  })

  it('shows caption length counter', () => {
    const view = renderPublicationStep({
      caption: 'abc',
    })

    mountedRoots.push(view.root)

    expect(view.container.textContent).toContain(`3/${CREATE_POST_CAPTION_MAX_LENGTH}`)
  })

  it('shows validation error when caption exceeds max length', () => {
    const view = renderPublicationStep({
      caption: 'a'.repeat(CREATE_POST_CAPTION_MAX_LENGTH + 1),
    })

    mountedRoots.push(view.root)

    const textarea = view.container.querySelector('textarea')
    const errorMessage = view.container.querySelector('[role="alert"]')

    expect(view.container.textContent).toContain(
      `Maximum number of characters ${CREATE_POST_CAPTION_MAX_LENGTH}`,
    )
    expect(textarea?.getAttribute('aria-invalid')).toBe('true')
    expect(textarea?.getAttribute('aria-describedby')).toBe(errorMessage?.id)
    expect(errorMessage?.textContent).toBe(
      `Maximum number of characters ${CREATE_POST_CAPTION_MAX_LENGTH}`,
    )
  })

  it('renders carousel controls for multiple exported images', () => {
    const view = renderPublicationStep({
      images: [createExportedImage('image-1'), createExportedImage('image-2')],
    })

    mountedRoots.push(view.root)

    expect(view.container.querySelector('button[aria-label="Previous image"]')).not.toBeNull()
    expect(view.container.querySelector('button[aria-label="Next image"]')).not.toBeNull()
    expect(view.container.querySelectorAll('button[aria-label^="Image "]')).toHaveLength(2)
  })

  it('does not render carousel controls for a single image', () => {
    const view = renderPublicationStep({
      images: [createExportedImage('image-1')],
    })

    mountedRoots.push(view.root)

    expect(view.container.querySelector('button[aria-label="Previous image"]')).toBeNull()
    expect(view.container.querySelector('button[aria-label="Next image"]')).toBeNull()
  })

  it('renders multiple images in state order and switches exported preview URLs', () => {
    const view = renderPublicationStep({
      images: [createExportedImage('image-1'), createExportedImage('image-2')],
    })

    mountedRoots.push(view.root)

    const paginationButtons = view.container.querySelectorAll('button[aria-label^="Image "]')

    expect(paginationButtons).toHaveLength(2)
    expect(paginationButtons[0]?.getAttribute('aria-label')).toBe('Image 1')
    expect(paginationButtons[1]?.getAttribute('aria-label')).toBe('Image 2')

    const getPreviewSrc = () => view.container.querySelector('img')?.getAttribute('src')

    expect(getPreviewSrc()).toBe('blob:image-1-exported')
    expect(getPreviewSrc()).not.toBe('blob:image-1')

    act(() => {
      view.container
        .querySelector('button[aria-label="Next image"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(getPreviewSrc()).toBe('blob:image-2-exported')
    expect(getPreviewSrc()).not.toBe('blob:image-2')

    act(() => {
      paginationButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(getPreviewSrc()).toBe('blob:image-1-exported')
  })
})
