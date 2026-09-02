import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'

import type { PostImage } from '@/entities/post'
import { I18nProvider } from '@/shared/lib/i18n'
import { PublicPostCarousel } from '../ui/PublicPostCarousel'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, className, src }: { alt: string; className?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img alt={alt} className={className} src={src} />
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const media: PostImage[] = [
  { alt: '16:9 landscape fixture', id: 'media-1', url: '/storybook/post-16-9.svg' },
]

function renderCarousel(fit?: 'contain' | 'cover'): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() =>
    root.render(
      <I18nProvider>
        <PublicPostCarousel fit={fit} media={media} />
      </I18nProvider>,
    ),
  )

  return { container, root }
}

describe('PublicPostCarousel', () => {
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

  it('keeps thumbnail cover fit by default', () => {
    const view = renderCarousel()
    mountedRoots.push(view)

    const carousel = view.container.querySelector('[data-fit="cover"]')
    const image = view.container.querySelector('img[alt="16:9 landscape fixture"]')

    expect(carousel).toBeInstanceOf(HTMLDivElement)
    expect(getComputedStyle(image as Element).objectFit).toBe('cover')
  })

  it('uses contain fit so cropped landscape media is not recropped', () => {
    const view = renderCarousel('contain')
    mountedRoots.push(view)

    const carousel = view.container.querySelector('[data-fit="contain"]')
    const image = view.container.querySelector('img[alt="16:9 landscape fixture"]')

    expect(carousel).toBeInstanceOf(HTMLDivElement)
    expect(getComputedStyle(image as Element).objectFit).toBe('contain')
  })
})
