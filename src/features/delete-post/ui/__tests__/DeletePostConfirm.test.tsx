import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeletePostConfirm, type DeletePostAction } from '../DeletePostConfirm'

vi.mock('@/shared/ui/button', () => ({
  Button: ({
    asChild: _asChild,
    children,
    loading,
    loadingText,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
    variant?: string
  }) => (
    <button {...props} aria-busy={loading || undefined} type="button">
      {loading && loadingText ? loadingText : children}
    </button>
  ),
}))

vi.mock('@/shared/ui/modal', () => ({
  Modal: ({
    children,
    hideCloseButton,
    modalTitle,
    onCloseAction,
    open,
  }: {
    children: React.ReactNode
    hideCloseButton?: boolean
    modalTitle: string
    onCloseAction: () => void
    open: boolean
  }) =>
    open ? (
      <section aria-label={modalTitle} role="dialog">
        {!hideCloseButton ? (
          <button aria-label="Close" onClick={onCloseAction} type="button">
            Close
          </button>
        ) : null}
        <h2>{modalTitle}</h2>
        {children}
      </section>
    ) : null,
}))

vi.mock('@/shared/ui/typography', () => ({
  Text: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & {
    children: React.ReactNode
  }) => <p {...props}>{children}</p>,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined
  let reject: (reason?: unknown) => void = () => undefined

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

function renderDeletePostConfirm({
  deletePostAction = vi.fn<DeletePostAction>().mockResolvedValue(true),
  onCloseAction = vi.fn(),
  onDeletedAction = vi.fn(),
  open = true,
  postId = 'post-1',
}: Partial<React.ComponentProps<typeof DeletePostConfirm>> = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <DeletePostConfirm
        deletePostAction={deletePostAction}
        onCloseAction={onCloseAction}
        onDeletedAction={onDeletedAction}
        open={open}
        postId={postId}
      />,
    )
  })

  return { container, root }
}

function getButton(container: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent === name || item.getAttribute('aria-label') === name,
  )

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

async function clickButtonAndFlush(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await Promise.resolve()
  })
}

describe('DeletePostConfirm', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    vi.clearAllMocks()
  })

  it('renders delete confirmation copy', () => {
    const view = renderDeletePostConfirm()
    mountedRoots.push(view)

    expect(view.container.querySelector('[role="dialog"]')).toBeInstanceOf(HTMLElement)
    expect(view.container.textContent).toContain('Are you sure you want to delete this post?')
    expect(getButton(view.container, 'Yes')).toBeInstanceOf(HTMLButtonElement)
    expect(getButton(view.container, 'No')).toBeInstanceOf(HTMLButtonElement)
  })

  it('does not render when closed', () => {
    const view = renderDeletePostConfirm({ open: false })
    mountedRoots.push(view)

    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('closes without deleting when No is clicked', () => {
    const deletePostAction = vi.fn<DeletePostAction>().mockResolvedValue(true)
    const onCloseAction = vi.fn()
    const onDeletedAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onCloseAction, onDeletedAction })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'No'))

    expect(deletePostAction).not.toHaveBeenCalled()
    expect(onCloseAction).toHaveBeenCalledTimes(1)
    expect(onDeletedAction).not.toHaveBeenCalled()
  })

  it('closes without deleting when close button is clicked', () => {
    const deletePostAction = vi.fn<DeletePostAction>().mockResolvedValue(true)
    const onCloseAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onCloseAction })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Close'))

    expect(deletePostAction).not.toHaveBeenCalled()
    expect(onCloseAction).toHaveBeenCalledTimes(1)
  })

  it('deletes the post and reports success when Yes is clicked', async () => {
    const deletePostAction = vi.fn<DeletePostAction>().mockResolvedValue(true)
    const onDeletedAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onDeletedAction, postId: 'post-7' })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(deletePostAction).toHaveBeenCalledWith({ postId: 'post-7' })
    expect(deletePostAction).toHaveBeenCalledTimes(1)
    expect(onDeletedAction).toHaveBeenCalledTimes(1)
  })

  it('blocks duplicate delete while request is pending', async () => {
    const deletion = createDeferred<boolean>()
    const deletePostAction = vi.fn<DeletePostAction>().mockReturnValue(deletion.promise)
    const onDeletedAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onDeletedAction })
    mountedRoots.push(view)

    await act(async () => {
      getButton(view.container, 'Yes').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(getButton(view.container, 'Deleting').disabled).toBe(true)
    expect(view.container.querySelector('[aria-label="Close"]')).toBeNull()

    await act(async () => {
      getButton(view.container, 'Deleting').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      deletion.resolve(true)
      await deletion.promise
    })

    expect(deletePostAction).toHaveBeenCalledTimes(1)
    expect(onDeletedAction).toHaveBeenCalledTimes(1)
  })

  it('keeps the dialog open and shows an error when delete fails', async () => {
    const deletePostAction = vi
      .fn<DeletePostAction>()
      .mockRejectedValue(new Error('Delete is unavailable.'))
    const onDeletedAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onDeletedAction })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(view.container.querySelector('[role="dialog"]')).toBeInstanceOf(HTMLElement)
    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Delete is unavailable.',
    )
    expect(getButton(view.container, 'Yes').disabled).toBe(false)
    expect(onDeletedAction).not.toHaveBeenCalled()
  })

  it('treats a false delete result as a deletion error', async () => {
    const deletePostAction = vi.fn<DeletePostAction>().mockResolvedValue(false)
    const onDeletedAction = vi.fn()
    const view = renderDeletePostConfirm({ deletePostAction, onDeletedAction })
    mountedRoots.push(view)

    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      'Post deletion failed. Please try again.',
    )
    expect(onDeletedAction).not.toHaveBeenCalled()
  })
})
