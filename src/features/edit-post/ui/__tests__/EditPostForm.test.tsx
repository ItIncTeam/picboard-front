import { act, type ComponentProps, type SVGProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import type { PostEntity } from '@/entities/post'

import { EditPostForm } from '../EditPostForm'

const apiMocks = vi.hoisted(() => ({
  updatePostDescription: vi.fn(),
}))

const synchronizationMocks = vi.hoisted(() => ({
  synchronizeUpdatedPost: vi.fn(),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img alt={alt} src={src} />
  ),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('@/features/edit-post/model/synchronizeUpdatedPost', () => ({
  synchronizeUpdatedPost: synchronizationMocks.synchronizeUpdatedPost,
}))

vi.mock('@/shared/assets', () => ({
  Close: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('@/entities/post/api/postsApi', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>

  return {
    ...actual,
    updatePostDescription: apiMocks.updatePostDescription,
  }
})

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createPost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    attachments: [],
    createdAt: '2026-08-20T12:00:00.000Z',
    description: 'Updated description',
    id: 'post-1',
    ownerId: 'owner-1',
    updatedAt: '2026-08-20T12:00:00.000Z',
    ...overrides,
  }
}

function renderForm({
  description = 'Original description',
  onCloseAction = vi.fn(),
  onSavedAction = vi.fn(),
  synchronizePostUpdateAction = vi.fn().mockResolvedValue(undefined),
}: {
  description?: string
  onCloseAction?: () => void
  onSavedAction?: (post: PostEntity) => void
  synchronizePostUpdateAction?: (postId: string) => Promise<void>
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() =>
    root.render(
      <EditPostForm
        description={description}
        media={<div>media</div>}
        onCloseAction={onCloseAction}
        onSavedAction={onSavedAction}
        postId="post-1"
        synchronizePostUpdateAction={synchronizePostUpdateAction}
      />,
    ),
  )

  return { container, root }
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    }
  }

  throw lastError
}

function getDialogText(): string {
  return document.body.textContent ?? ''
}

function getSaveButton(): HTMLButtonElement {
  const saveButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('Save Changes'),
  )

  if (!(saveButton instanceof HTMLButtonElement)) {
    throw new Error('Expected Save Changes button.')
  }

  return saveButton
}

function getTextarea(): HTMLTextAreaElement {
  const textarea = document.body.querySelector('textarea')

  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error('Expected description textarea.')
  }

  return textarea
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(textarea)
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  valueSetter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
}

function clickSave() {
  getSaveButton().dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('EditPostForm', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    apiMocks.updatePostDescription.mockReset()
    synchronizationMocks.synchronizeUpdatedPost.mockReset()
    synchronizationMocks.synchronizeUpdatedPost.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
  })

  it('does not save when the description is unchanged', () => {
    const view = renderForm()
    mountedRoots.push(view)

    expect(getSaveButton().disabled).toBe(true)

    act(() => {
      clickSave()
    })

    expect(apiMocks.updatePostDescription).not.toHaveBeenCalled()
  })

  it('sends null when the description is empty or whitespace-only', async () => {
    apiMocks.updatePostDescription.mockResolvedValue(createPost({ description: null }))
    const onSavedAction = vi.fn()
    const view = renderForm({ onSavedAction })
    mountedRoots.push(view)

    act(() => {
      setTextareaValue(getTextarea(), '   ')
    })
    act(() => {
      clickSave()
    })

    await waitFor(() => {
      expect(apiMocks.updatePostDescription).toHaveBeenCalledWith({
        description: null,
        postId: 'post-1',
      })
      expect(onSavedAction).toHaveBeenCalledTimes(1)
    })
  })

  it('shows a save error and keeps the form open when the mutation fails', async () => {
    apiMocks.updatePostDescription
      .mockRejectedValueOnce(new Error('Gateway unavailable'))
      .mockResolvedValueOnce(createPost())
    const onSavedAction = vi.fn()
    const view = renderForm({ onSavedAction })
    mountedRoots.push(view)

    act(() => {
      setTextareaValue(getTextarea(), 'Updated description')
    })
    act(() => {
      clickSave()
    })

    await waitFor(() => expect(getDialogText()).toContain('Gateway unavailable'))
    expect(onSavedAction).not.toHaveBeenCalled()
    expect(document.body.querySelector('textarea')).toBeInstanceOf(HTMLTextAreaElement)

    act(() => {
      clickSave()
    })

    await waitFor(() => expect(onSavedAction).toHaveBeenCalledTimes(1))
    expect(apiMocks.updatePostDescription).toHaveBeenCalledTimes(2)
    expect(getDialogText()).not.toContain('Gateway unavailable')
  })

  it('ignores a second Save click while the first save is in flight', async () => {
    let resolveSave: ((post: PostEntity) => void) | undefined
    apiMocks.updatePostDescription.mockImplementation(
      () =>
        new Promise<PostEntity>((resolve) => {
          resolveSave = resolve
        }),
    )

    const view = renderForm()
    mountedRoots.push(view)

    act(() => {
      setTextareaValue(getTextarea(), 'Updated description')
    })
    act(() => {
      clickSave()
    })
    act(() => {
      clickSave()
    })

    expect(apiMocks.updatePostDescription).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave?.(createPost())
    })
  })

  it('asks to keep editing or discard unsaved changes', async () => {
    const onCloseAction = vi.fn()
    const view = renderForm({ onCloseAction })
    mountedRoots.push(view)

    act(() => {
      setTextareaValue(getTextarea(), 'Dirty description')
    })
    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })

    await waitFor(() => expect(getDialogText()).toContain('Close posting editor'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Keep editing')
        ?.click()
    })

    await waitFor(() => expect(getDialogText()).not.toContain('Close posting editor'))
    expect(onCloseAction).not.toHaveBeenCalled()
    expect(getTextarea().value).toBe('Dirty description')

    act(() => {
      document.body.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click()
    })
    await waitFor(() => expect(getDialogText()).toContain('Discard'))

    act(() => {
      Array.from(document.body.querySelectorAll('button'))
        .find((button) => button.textContent === 'Discard')
        ?.click()
    })

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledTimes(1))
    expect(apiMocks.updatePostDescription).not.toHaveBeenCalled()
  })

  it('treats a successful save as success even when public-home revalidation fails', async () => {
    apiMocks.updatePostDescription.mockResolvedValue(createPost())
    const onSavedAction = vi.fn()
    const synchronizePostUpdateAction = vi.fn().mockRejectedValue(new Error('Invalidation failed'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const view = renderForm({ onSavedAction, synchronizePostUpdateAction })
    mountedRoots.push(view)

    act(() => {
      setTextareaValue(getTextarea(), 'Updated description')
    })
    act(() => {
      clickSave()
    })

    await waitFor(() => expect(onSavedAction).toHaveBeenCalledTimes(1))
    expect(getDialogText()).not.toContain('Invalidation failed')
    expect(consoleError).toHaveBeenCalledWith(
      '[EditPost] unexpected post-update synchronization failure',
      {
        postId: 'post-1',
        reason: expect.any(Error),
      },
    )

    consoleError.mockRestore()
  })
})
