import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'
import { ToastProvider } from '@/shared/ui/toast'

import { SignUpForm } from '../SignUpForm'

const apiMocks = vi.hoisted(() => ({
  signUp: vi.fn(),
}))

vi.mock('../api', () => ({
  signUp: apiMocks.signUp,
}))

vi.mock('@/shared/assets', () => ({
  CloseEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  OpenEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  SearchIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({
    children,
    loading: _loading,
    loadingText: _loadingText,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    loadingText?: string
  }) => (
    <button {...props} type="button">
      {children}
    </button>
  ),
}))

vi.mock('@/shared/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean
    onCheckedChange?: (value: boolean) => void
  }) => (
    <input
      checked={checked}
      onChange={(event) => {
        onCheckedChange?.(event.currentTarget.checked)
      }}
      type="checkbox"
    />
  ),
}))

vi.mock('@/shared/ui/input/Input', () => ({
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

vi.mock('@/shared/ui/typography', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
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

function renderSignUpForm(): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <ToastProvider>
          <SignUpForm onOpenPrivacy={vi.fn()} onOpenTerms={vi.fn()} onSuccess={vi.fn()} />
        </ToastProvider>
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

describe('SignUpForm', () => {
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
    apiMocks.signUp.mockReset()
  })

  it('renders account fields and submit button', () => {
    const view = renderSignUpForm()

    mountedRoots.push(view)

    expect(getInput(view.container, 'Username')).toBeInstanceOf(HTMLInputElement)
    expect(getInput(view.container, 'Email')).toBeInstanceOf(HTMLInputElement)
    expect(getInput(view.container, 'Password')).toBeInstanceOf(HTMLInputElement)
    expect(getInput(view.container, 'Password confirmation')).toBeInstanceOf(HTMLInputElement)

    const button = Array.from(view.container.querySelectorAll('button')).find(
      (item) => item.textContent === 'Sign Up',
    )

    expect(button).toBeInstanceOf(HTMLButtonElement)
  })
})
