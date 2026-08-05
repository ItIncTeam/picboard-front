import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PublicError from '../error'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderPublicError(reset: () => void): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<PublicError error={new Error('Gateway unavailable')} unstable_retry={reset} />)
  })

  return { container, root }
}

describe('Public route error boundary', () => {
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

  it('renders a recovery message and retries the failed server render', () => {
    const reset = vi.fn()
    const view = renderPublicError(reset)
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('Public posts are unavailable')
    expect(view.container.textContent).toContain('Please try loading the page again.')

    const retryButton = view.container.querySelector('button')
    act(() => retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(reset).toHaveBeenCalledOnce()
  })
})
