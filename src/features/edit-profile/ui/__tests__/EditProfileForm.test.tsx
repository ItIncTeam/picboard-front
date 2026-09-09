import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import type { EditProfileFormProps, EditProfileFormValues } from '../../model/types'
import { EditProfileForm } from '../EditProfileForm'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const initialValues: EditProfileFormValues = {
  aboutMe: '',
  city: '',
  country: '',
  dateOfBirth: null,
  firstName: 'Svetlana',
  lastName: 'Ivanova',
  username: 'user-test',
}

async function renderForm(overrides: Partial<EditProfileFormProps> = {}): Promise<RenderResult> {
  const container = document.createElement('div')
  const root = createRoot(container)
  const props: EditProfileFormProps = {
    cityOptionsByCountryValue: {},
    countryOptions: [],
    initialValues,
    onSubmitAction: vi.fn().mockResolvedValue(initialValues),
    ...overrides,
  }

  document.body.append(container)
  await act(async () => {
    root.render(
      <I18nProvider>
        <EditProfileForm {...props} />
      </I18nProvider>,
    )
    await Promise.resolve()
  })

  return { container, root }
}

async function setInputValue(input: HTMLInputElement, value: string): Promise<void> {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

  await act(async () => {
    valueSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

async function submitForm(form: HTMLFormElement | null): Promise<void> {
  await act(async () => {
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await Promise.resolve()
  })
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    }
  }

  throw lastError
}

describe('EditProfileForm', () => {
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

  it('renders the initial values, static tabs, and disabled Save Changes', async () => {
    const view = await renderForm()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('General information')
    expect(view.container.textContent).toContain('Devices')
    expect(view.container.querySelector('input[name="username"]')).toHaveValue('user-test')
    expect(view.container.querySelector('button[type="submit"]')).toBeDisabled()
  })

  it('submits once and resets the form with saved values', async () => {
    const savedValues = { ...initialValues, username: 'saved-user' }
    const onSubmitAction = vi.fn().mockResolvedValue(savedValues)
    const view = await renderForm({ onSubmitAction })
    mountedRoots.push(view)
    const usernameInput = view.container.querySelector('input[name="username"]')

    if (!(usernameInput instanceof HTMLInputElement)) {
      throw new Error('Expected username input.')
    }

    await setInputValue(usernameInput, 'new-user')
    const form = view.container.querySelector('form')
    await submitForm(form)

    await waitFor(() => expect(onSubmitAction).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(usernameInput).toHaveValue('saved-user'))
    expect(view.container.querySelector('button[type="submit"]')).toBeDisabled()
  })

  it('keeps dirty values after a submit error', async () => {
    const onSubmitAction = vi.fn().mockRejectedValue(new Error('Request failed'))
    const view = await renderForm({ onSubmitAction })
    mountedRoots.push(view)
    const usernameInput = view.container.querySelector('input[name="username"]')

    if (!(usernameInput instanceof HTMLInputElement)) {
      throw new Error('Expected username input.')
    }

    await setInputValue(usernameInput, 'new-user')
    const form = view.container.querySelector('form')
    await submitForm(form)

    await waitFor(() => expect(view.container.querySelector('[role="alert"]')).not.toBeNull())
    expect(usernameInput).toHaveValue('new-user')
    expect(view.container.querySelector('button[type="submit"]')).not.toBeDisabled()
  })
})
