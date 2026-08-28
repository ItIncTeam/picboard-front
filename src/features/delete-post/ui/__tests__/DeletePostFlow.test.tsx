import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeletePostFlow, type DeletePostFlowProps } from '../DeletePostFlow'

const navigationMocks = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
  },
}))

const synchronizationMocks = vi.hoisted(() => ({
  synchronizeDeletedPost: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks.router,
}))

vi.mock('../../model/synchronizeDeletedPost', () => ({
  synchronizeDeletedPost: synchronizationMocks.synchronizeDeletedPost,
}))

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

function renderDeletePostFlow({
  deletePostAction = vi.fn().mockResolvedValue(true),
  postId = 'post-1',
  synchronizePostDeletionAction = vi.fn().mockResolvedValue(undefined),
  ...props
}: Partial<DeletePostFlowProps> = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <DeletePostFlow
        deletePostAction={deletePostAction}
        postId={postId}
        synchronizePostDeletionAction={synchronizePostDeletionAction}
        {...props}
      />,
    )
  })

  return { container, root }
}

function getButton(container: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent === name || item.getAttribute('aria-label') === name,
  )

  if (!(button instanceof HTMLButtonElement)) {
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

describe('DeletePostFlow', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    navigationMocks.router.replace.mockReset()
    synchronizationMocks.synchronizeDeletedPost.mockReset()
    synchronizationMocks.synchronizeDeletedPost.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    vi.clearAllMocks()
  })

  it('renders a default Delete Post trigger and opens confirmation', () => {
    const view = renderDeletePostFlow()
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))

    expect(view.container.querySelector('[role="dialog"]')).toBeInstanceOf(HTMLElement)
  })

  it('supports a menu item render boundary for Post Details integration', () => {
    const view = renderDeletePostFlow({
      children: ({ openDeleteConfirmAction }) => (
        <button onClick={openDeleteConfirmAction} type="button">
          Menu Delete Post
        </button>
      ),
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Menu Delete Post'))

    expect(view.container.querySelector('[role="dialog"]')).toBeInstanceOf(HTMLElement)
  })

  it('deletes, synchronizes app state, and redirects to main', async () => {
    const deletePostAction = vi.fn().mockResolvedValue(true)
    const onDeletedAction = vi.fn()
    const synchronizePostDeletionAction = vi.fn().mockResolvedValue(undefined)
    const view = renderDeletePostFlow({
      deletePostAction,
      onDeletedAction,
      postId: 'post-7',
      synchronizePostDeletionAction,
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(deletePostAction).toHaveBeenCalledWith({ postId: 'post-7' })
    expect(synchronizePostDeletionAction).toHaveBeenCalledWith('post-7')
    expect(onDeletedAction).toHaveBeenCalledTimes(1)
    expect(navigationMocks.router.replace).toHaveBeenCalledWith('/main')
  })

  it('keeps the user on the post and skips synchronization when deletion fails', async () => {
    const deletePostAction = vi.fn().mockRejectedValue(new Error('Deletion failed.'))
    const synchronizePostDeletionAction = vi.fn()
    const view = renderDeletePostFlow({ deletePostAction, synchronizePostDeletionAction })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe('Deletion failed.')
    expect(synchronizePostDeletionAction).not.toHaveBeenCalled()
    expect(navigationMocks.router.replace).not.toHaveBeenCalled()
  })
})
