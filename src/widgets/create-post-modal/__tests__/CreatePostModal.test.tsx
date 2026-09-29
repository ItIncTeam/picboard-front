import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'
import { CreatePostModal } from '../CreatePostModal'

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams({ returnTo: '/profile?tab=posts' }),
}))

vi.mock('@/features/create-post/model/synchronizeCreatedPost', () => ({
  synchronizeCreatedPost: () => Promise.resolve(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={typeof href === 'string' ? href : undefined}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock('@/shared/assets', async (importOriginal) => {
  const assets = (await importOriginal()) as Record<string, unknown>
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />

  return {
    ...assets,
    AddImage: Icon,
    ArrowBackIcon: Icon,
    ArrowNextIcon: Icon,
    AspectRatioBtn: Icon,
    Close: Icon,
    Dot: Icon,
    ShowSwiper: Icon,
  }
})

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderCreatePostModal(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() =>
    root.render(
      <I18nProvider>
        <CreatePostModal />
      </I18nProvider>,
    ),
  )

  return { container, root }
}

function getFileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]')

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected file input.')
  }

  return input
}

function addUnsavedImage() {
  const input = getFileInput()
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })

  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  })

  act(() => input.dispatchEvent(new Event('change', { bubbles: true })))
}

function getButton(name: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent === name || item.getAttribute('aria-label') === name,
  )

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected button "${name}".`)
  }

  return button
}

function pressEscape() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
  })
}

function clickBackdrop() {
  const overlay = Array.from(document.querySelectorAll('[data-state="open"]')).find(
    (element) => element.getAttribute('role') !== 'dialog',
  )

  if (!(overlay instanceof HTMLElement)) {
    throw new Error('Expected modal backdrop.')
  }

  act(() => {
    overlay.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }),
    )
    overlay.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }),
    )
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('CreatePostModal', () => {
  const views: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
    navigationMocks.replace.mockReset()
    navigationMocks.searchParams = new URLSearchParams({ returnTo: '/profile?tab=posts' })

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
  })

  afterEach(async () => {
    views.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    views.length = 0
    await flushEffects()
    vi.restoreAllMocks()
  })

  it('routes backdrop dismissal with unsaved data through confirm and keeps state', async () => {
    const view = renderCreatePostModal()
    views.push(view)
    await flushEffects()
    addUnsavedImage()

    clickBackdrop()
    await flushEffects()

    expect(document.body.textContent).toContain('Do you really want to close')
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    act(() => getButton('Keep editing').click())
    await flushEffects()

    expect(document.body.textContent).toContain('1 photo selected')
    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('routes Escape with unsaved data through confirm and discards to safe returnTo', async () => {
    const view = renderCreatePostModal()
    views.push(view)
    await flushEffects()
    addUnsavedImage()

    pressEscape()
    await flushEffects()

    expect(document.body.textContent).toContain('Do you really want to close')
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    act(() => getButton('Discard').click())
    await flushEffects()

    expect(navigationMocks.replace).toHaveBeenCalledWith('/profile?tab=posts')
  })

  it('closes immediately on dismiss when there is no unsaved data', async () => {
    const view = renderCreatePostModal()
    views.push(view)
    await flushEffects()

    pressEscape()
    await flushEffects()

    expect(navigationMocks.replace).toHaveBeenCalledWith('/profile?tab=posts')
    expect(document.body.textContent).not.toContain('Do you really want to close')
  })
})
