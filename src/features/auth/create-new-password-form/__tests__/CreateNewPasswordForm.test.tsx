import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authRoutes } from '@/shared/lib/auth'
import { I18nProvider } from '@/shared/lib/i18n'

import { CreateNewPasswordForm } from '../CreateNewPasswordForm'

const apiMocks = vi.hoisted(() => ({
  passwordReset: vi.fn(),
  setNewPassword: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('@/features/auth/api/passwordRecoveryApi', () => ({
  passwordReset: apiMocks.passwordReset,
  setNewPassword: apiMocks.setNewPassword,
}))

vi.mock('@/shared/assets', () => ({
  CloseEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  GithubIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  GoogleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  OpenEyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  SearchIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.push,
  }),
  useSearchParams: () => navigationMocks.searchParams,
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

function renderForm(searchParams = new URLSearchParams({ code: 'recovery-code' })): RenderResult {
  navigationMocks.searchParams = searchParams

  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  act(() => {
    root.render(
      <I18nProvider>
        <CreateNewPasswordForm />
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

function getSubmitButton(container: HTMLElement): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((item) =>
    item.textContent?.includes('Create new password'),
  )

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected submit button.')
  }

  return button
}

async function fillInput(input: HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

    valueSetter?.call(input, value)
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('blur', { bubbles: true }))
  })
}

async function submitForm(container: HTMLElement): Promise<void> {
  const form = container.querySelector('form')

  if (!form) {
    throw new Error('Expected form.')
  }

  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

async function waitFor(assertion: () => void): Promise<void> {
  const timeoutAt = Date.now() + 1000
  let lastError: unknown

  while (Date.now() < timeoutAt) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
      })
    }
  }

  throw lastError
}

async function flushPendingUpdates(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('CreateNewPasswordForm', () => {
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
    apiMocks.setNewPassword.mockReset()
    navigationMocks.push.mockReset()
    navigationMocks.searchParams = new URLSearchParams()
    vi.useRealTimers()
  })

  it('shows error when code is missing', () => {
    const view = renderForm(new URLSearchParams())

    mountedRoots.push(view)

    expect(view.container.textContent).toContain(
      'Invalid recovery link. Please request a new password reset.',
    )

    const link = view.container.querySelector('a')

    expect(link?.getAttribute('href')).toBe(authRoutes.forgotPassword)
    expect(apiMocks.setNewPassword).not.toHaveBeenCalled()
  })

  it('validates password and confirmation match', async () => {
    const view = renderForm()

    mountedRoots.push(view)

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password2!')
    await submitForm(view.container)

    await waitFor(() => {
      expect(view.container.textContent).toContain('The passwords must match')
    })

    expect(apiMocks.setNewPassword).not.toHaveBeenCalled()
  })

  it('calls setNewPassword with code and password', async () => {
    apiMocks.setNewPassword.mockResolvedValueOnce({ message: 'Password changed' })

    const view = renderForm(new URLSearchParams({ code: 'recovery-code' }))

    mountedRoots.push(view)

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password1!')
    await submitForm(view.container)

    await waitFor(() => {
      expect(apiMocks.setNewPassword).toHaveBeenCalledWith({
        code: 'recovery-code',
        password: 'Password1!',
      })
    })
  })

  it('shows success message after successful submission', async () => {
    apiMocks.setNewPassword.mockResolvedValueOnce({ message: 'Password changed' })

    const view = renderForm()

    mountedRoots.push(view)

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password1!')
    await submitForm(view.container)

    await waitFor(() => {
      expect(view.container.textContent).toContain('Password has been changed successfully!')
    })
  })

  it('shows error on failure and allows retry', async () => {
    apiMocks.setNewPassword.mockRejectedValueOnce(new Error('Invalid confirmation code'))

    const view = renderForm()

    mountedRoots.push(view)

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password1!')
    await submitForm(view.container)

    await waitFor(() => {
      expect(view.container.textContent).toContain('Invalid confirmation code')
    })

    expect(getSubmitButton(view.container).disabled).toBe(false)
  })

  it('redirects to sign-in after success', async () => {
    vi.useFakeTimers()
    apiMocks.setNewPassword.mockResolvedValueOnce({ message: 'Password changed' })

    const view = renderForm()

    mountedRoots.push(view)

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password1!')
    await submitForm(view.container)

    await flushPendingUpdates()

    expect(view.container.textContent).toContain('Password has been changed successfully!')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(navigationMocks.push).toHaveBeenCalledWith(authRoutes.signIn)
  })

  it('clears redirect timeout on unmount', async () => {
    vi.useFakeTimers()
    apiMocks.setNewPassword.mockResolvedValueOnce({ message: 'Password changed' })

    const view = renderForm()

    await fillInput(getInput(view.container, 'New password'), 'Password1!')
    await fillInput(getInput(view.container, 'Password confirmation'), 'Password1!')
    await submitForm(view.container)

    await flushPendingUpdates()

    expect(view.container.textContent).toContain('Password has been changed successfully!')

    act(() => {
      view.root.unmount()
    })

    view.container.remove()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(navigationMocks.push).not.toHaveBeenCalled()
  })
})
