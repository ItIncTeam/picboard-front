import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { ForgotPasswordForm } from '@/features/auth'

const apiMocks = vi.hoisted(() => ({
  passwordReset: vi.fn(),
  setNewPassword: vi.fn(),
}))

vi.mock('@/features/auth/api/passwordRecoveryApi', () => ({
  passwordReset: apiMocks.passwordReset,
  setNewPassword: apiMocks.setNewPassword,
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({
    asChild,
    children,
    loading: _loading,
    loadingText: _loadingText,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
  }) => {
    if (asChild) {
      return children
    }

    return (
      <button {...props} type="button">
        {children}
      </button>
    )
  },
}))

vi.mock('@/shared/ui/input', () => ({
  Input: ({
    classNameLabel: _classNameLabel,
    error: _error,
    Icon: _Icon,
    label,
    onClick: _onClick,
    variant: _variant,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    classNameLabel?: string
    error?: string | null
    Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label?: string
    onClick?: () => void
    variant?: string
  }) => {
    const id = `input-${label}`

    return (
      <label htmlFor={id}>
        {label}
        <input {...props} id={id} />
      </label>
    )
  },
}))

vi.mock('@/shared/ui/recaptcha', () => ({
  Recaptcha: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean
    onCheckedChange?: (value: boolean) => void
  }) => (
    <input
      aria-label="reCAPTCHA verification"
      checked={checked}
      onChange={(event) => {
        onCheckedChange?.(event.currentTarget.checked)
      }}
      type="checkbox"
    />
  ),
}))

vi.mock('@/shared/ui/typography', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({
    executeRecaptcha: vi.fn().mockResolvedValue('captcha-token'),
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

function renderForgotPasswordForm(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <ForgotPasswordForm />
      </I18nProvider>,
    )
  })

  return { container, root }
}

function getInput(container: HTMLElement, labelText: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label')).find(
    (item) => item.textContent === labelText,
  )

  if (!label?.control || !(label.control instanceof HTMLInputElement)) {
    throw new Error(`Expected input with label "${labelText}".`)
  }

  return label.control
}

describe('ForgotPasswordForm', () => {
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
    apiMocks.passwordReset.mockReset()
  })

  it('renders email input and submit button', () => {
    const view = renderForgotPasswordForm()

    mountedRoots.push(view)

    expect(getInput(view.container, 'Email')).toBeInstanceOf(HTMLInputElement)

    const button = Array.from(view.container.querySelectorAll('button')).find(
      (item) => item.textContent === 'Send Link',
    )

    expect(button).toBeInstanceOf(HTMLButtonElement)
  })
})
