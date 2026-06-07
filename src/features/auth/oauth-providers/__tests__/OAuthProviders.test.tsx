import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OAuthProviders } from '../OAuthProviders'

vi.mock('@/shared/assets', () => ({
  GithubIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  GoogleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('next/image', () => ({
  default: () => null,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderOAuthProviders(intent: 'signIn' | 'signUp'): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(<OAuthProviders intent={intent} />)
  })

  return { container, root }
}

function getButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = container.querySelector(`button[aria-label="${label}"]`)

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected button with label "${label}".`)
  }

  return button
}

describe('OAuthProviders', () => {
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

  it('renders disabled sign-in provider buttons with availability labels', () => {
    const view = renderOAuthProviders('signIn')

    mountedRoots.push(view)

    const googleButton = getButton(view.container, 'Google sign-in is not available yet')
    const githubButton = getButton(view.container, 'GitHub sign-in is not available yet')

    expect(googleButton.disabled).toBe(true)
    expect(githubButton.disabled).toBe(true)
  })

  it('renders disabled sign-up provider buttons with availability labels', () => {
    const view = renderOAuthProviders('signUp')

    mountedRoots.push(view)

    const googleButton = getButton(view.container, 'Google sign-up is not available yet')
    const githubButton = getButton(view.container, 'GitHub sign-up is not available yet')

    expect(googleButton.disabled).toBe(true)
    expect(githubButton.disabled).toBe(true)
  })
})
