import { act, type SVGProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OAuthProviders } from '@/features/auth/oauth-providers'

const oauthMocks = vi.hoisted(() => ({
  startOAuthProvider: vi.fn(),
}))

vi.mock('@/features/auth/oauth', async () => {
  return {
    startOAuthProvider: oauthMocks.startOAuthProvider,
  }
})

vi.mock('@/shared/assets', () => ({
  GithubIcon: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  GoogleIcon: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
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
    oauthMocks.startOAuthProvider.mockReset()
  })

  it('redirects sign-in Google button to backend OAuth start', () => {
    const view = renderOAuthProviders('signIn')

    mountedRoots.push(view)

    const googleButton = getButton(view.container, 'Sign in with Google')
    const githubButton = getButton(view.container, 'Sign in with GitHub')

    expect(googleButton.disabled).toBe(false)
    expect(githubButton.disabled).toBe(false)

    act(() => {
      googleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(oauthMocks.startOAuthProvider).toHaveBeenCalledWith('google')
  })

  it('redirects sign-up GitHub button to backend OAuth start', () => {
    const view = renderOAuthProviders('signUp')

    mountedRoots.push(view)

    const googleButton = getButton(view.container, 'Sign up with Google')
    const githubButton = getButton(view.container, 'Sign up with GitHub')

    expect(googleButton.disabled).toBe(false)
    expect(githubButton.disabled).toBe(false)

    act(() => {
      githubButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(oauthMocks.startOAuthProvider).toHaveBeenCalledWith('github')
  })
})
