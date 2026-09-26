import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { SignInForm } from '../SignInForm'

vi.mock('@/features/auth/session-management', () => ({
  useSession: () => ({
    authenticateWithCurrentToken: vi.fn(),
  }),
}))

vi.mock('@/shared/assets', () => ({
  CloseEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  GithubIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  GoogleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  LogOutIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  OpenEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  SearchIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('@/shared/lib/toast', () => ({
  useToast: () => ({
    error: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function renderForm(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <SignInForm />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('SignInForm', () => {
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

  it('exposes stable credentials metadata to password managers', () => {
    const view = renderForm()

    mountedRoots.push(view)

    const emailInput = view.container.querySelector<HTMLInputElement>('input[name="email"]')
    const passwordInput = view.container.querySelector<HTMLInputElement>('input[name="password"]')

    expect(emailInput).toMatchObject({
      autocomplete: 'username',
      id: 'sign-in-email',
      type: 'email',
    })
    expect(passwordInput).toMatchObject({
      autocomplete: 'current-password',
      id: 'sign-in-password',
      type: 'password',
    })
  })
})
