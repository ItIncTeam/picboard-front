import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClosePostDetailsModal } from '../lib/useClosePostDetailsModal'

const navigationMocks = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: navigationMocks.back,
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function CloseHarness() {
  const close = useClosePostDetailsModal()

  return (
    <button onClick={close} type="button">
      Close
    </button>
  )
}

function renderCloseHarness(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(<CloseHarness />)
  })

  return { container, root }
}

function clickClose() {
  const button = document.querySelector('button')

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected Close button.')
  }

  act(() => {
    button.click()
  })
}

describe('useClosePostDetailsModal', () => {
  let view: RenderResult | null = null

  beforeEach(() => {
    navigationMocks.back.mockReset()
    navigationMocks.replace.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
  })

  afterEach(() => {
    if (!view) {
      return
    }

    const currentView = view

    act(() => currentView.root.unmount())
    currentView.container.remove()
    view = null
  })

  it('calls router.back when browser history can go back', () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    })

    view = renderCloseHarness()
    clickClose()

    expect(navigationMocks.back).toHaveBeenCalledTimes(1)
    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('falls back to sanitized returnTo when history cannot go back', () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 1,
    })
    navigationMocks.searchParams = new URLSearchParams({
      returnTo: '/profile/user-1',
    })

    view = renderCloseHarness()
    clickClose()

    expect(navigationMocks.back).not.toHaveBeenCalled()
    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    expect(navigationMocks.replace).toHaveBeenCalledWith('/profile/user-1')
  })

  it('falls back to /main when history cannot go back and returnTo is unsafe', () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 1,
    })
    navigationMocks.searchParams = new URLSearchParams({
      returnTo: '//evil.example',
    })

    view = renderCloseHarness()
    clickClose()

    expect(navigationMocks.back).not.toHaveBeenCalled()
    expect(navigationMocks.replace).toHaveBeenCalledWith('/main')
  })
})
