import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPostInitialState,
  type CreatePostImage,
  type CreatePostState,
} from '@/features/create-post'

import { CreatePostFlow } from '../CreatePostFlow'

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

function createState(overrides: Partial<CreatePostState> = {}): CreatePostState {
  return {
    ...createPostInitialState,
    ...overrides,
  }
}

function renderCreatePostFlow({
  initialState,
  onCloseAction = vi.fn(),
}: {
  initialState?: CreatePostState
  onCloseAction?: () => void
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<CreatePostFlow initialState={initialState} onCloseAction={onCloseAction} />)
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

describe('CreatePostFlow', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
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
})
