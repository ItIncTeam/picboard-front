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

const postApiMocks = vi.hoisted(() => ({
  deletePost: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks.router,
}))

vi.mock('@/entities/post', () => ({
  deletePost: postApiMocks.deletePost,
}))

vi.mock('@/features/delete-post/model/synchronizeDeletedPost', () => ({
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

async function waitFor(assertion: () => void): Promise<void> {
  const timeoutAt = Date.now() + 1000
  let lastError: unknown

  while (Date.now() < timeoutAt) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
      })
    }
  }

  throw lastError
}

describe('DeletePostFlow', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    navigationMocks.router.replace.mockReset()
    postApiMocks.deletePost.mockReset()
    postApiMocks.deletePost.mockResolvedValue(true)
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

  it('deletes, synchronizes app state, and redirects to main without returnTo', async () => {
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

  it('redirects to a safe returnTo path after deletion', async () => {
    const deletePostAction = vi.fn().mockResolvedValue(true)
    const view = renderDeletePostFlow({
      deletePostAction,
      postId: 'post-7',
      returnTo: '/profile/user-1',
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    expect(navigationMocks.router.replace).toHaveBeenCalledWith('/profile/user-1')
  })

  it('redirects to main when the success callback rejects after deletion', async () => {
    const deletePostAction = vi.fn().mockResolvedValue(true)
    const onDeletedAction = vi.fn().mockRejectedValue(new Error('Callback failed.'))
    const synchronizePostDeletionAction = vi.fn().mockResolvedValue(undefined)
    const view = renderDeletePostFlow({
      deletePostAction,
      onDeletedAction,
      synchronizePostDeletionAction,
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith('/main')
      expect(navigationMocks.router.replace).toHaveBeenCalledTimes(1)
    })
  })

  it('redirects to main when the success callback throws synchronously after deletion', async () => {
    const deletePostAction = vi.fn().mockResolvedValue(true)
    const onDeletedAction = vi.fn(() => {
      throw new Error('Synchronous callback failed.')
    })
    const synchronizePostDeletionAction = vi.fn().mockResolvedValue(undefined)
    const view = renderDeletePostFlow({
      deletePostAction,
      onDeletedAction,
      synchronizePostDeletionAction,
    })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith('/main')
      expect(navigationMocks.router.replace).toHaveBeenCalledTimes(1)
    })
  })

  it('redirects to main when synchronization fails after deletion', async () => {
    const deletePostAction = vi.fn().mockResolvedValue(true)
    const synchronizePostDeletionAction = vi.fn().mockRejectedValue(new Error('Sync failed.'))
    const view = renderDeletePostFlow({ deletePostAction, synchronizePostDeletionAction })
    mountedRoots.push(view)

    clickButton(getButton(view.container, 'Delete Post'))
    await clickButtonAndFlush(getButton(view.container, 'Yes'))

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith('/main')
      expect(navigationMocks.router.replace).toHaveBeenCalledTimes(1)
    })
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
