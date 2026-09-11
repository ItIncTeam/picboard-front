import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EditPostMenu } from '../EditPostMenu'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img alt={alt} src={src} />
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderMenu({
  onDeleteAction,
  onEditAction = vi.fn(),
}: {
  onDeleteAction?: () => void
  onEditAction?: () => void
} = {}): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() =>
    root.render(<EditPostMenu onDeleteAction={onDeleteAction} onEditAction={onEditAction} />),
  )

  return { container, root }
}

describe('EditPostMenu', () => {
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
  })

  it('shows Edit Post only when delete is not wired yet', () => {
    const view = renderMenu()
    mountedRoots.push(view)

    act(() => {
      view.container.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    expect(view.container.textContent).toContain('Edit Post')
    expect(view.container.textContent).not.toContain('Delete Post')
  })

  it('shows Delete Post next to Edit Post when onDeleteAction is provided', () => {
    const onDeleteAction = vi.fn()
    const onEditAction = vi.fn()
    const view = renderMenu({ onDeleteAction, onEditAction })
    mountedRoots.push(view)

    act(() => {
      view.container.querySelector<HTMLButtonElement>('button[aria-label="Post actions"]')?.click()
    })

    expect(view.container.textContent).toContain('Edit Post')
    expect(view.container.textContent).toContain('Delete Post')

    act(() => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Delete Post')
        ?.click()
    })

    expect(onDeleteAction).toHaveBeenCalledTimes(1)
    expect(onEditAction).not.toHaveBeenCalled()
  })
})
