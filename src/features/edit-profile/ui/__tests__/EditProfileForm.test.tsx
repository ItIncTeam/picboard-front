import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'
import type { SelectOption } from '@/shared/ui/select'

import type { EditProfileFormProps, EditProfileFormValues } from '../../model/types'
import { EditProfileForm } from '../EditProfileForm'

type MockSelectProps = {
  disabled?: boolean
  label?: string
  onValueChange?: (value: string) => void
  options: ReadonlyArray<SelectOption>
  placeholder?: string
  value?: string
}

vi.mock('@/shared/ui/select', () => ({
  Select: ({ disabled, label, onValueChange, options, placeholder, value }: MockSelectProps) => (
    <label>
      {label}
      <select
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

type Deferred<Value> = {
  promise: Promise<Value>
  resolve: (value: Value) => void
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

function createDeferred<Value>(): Deferred<Value> {
  let resolve: ((value: Value) => void) | undefined
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve
  })

  if (!resolve) {
    throw new Error('Expected deferred promise resolver.')
  }

  return { promise, resolve }
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

async function setSelectValue(select: HTMLSelectElement, value: string): Promise<void> {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set

  await act(async () => {
    valueSetter?.call(select, value)
    select.dispatchEvent(new Event('change', { bubbles: true }))
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

  it('renders the initial values and disabled Save Changes', async () => {
    const view = await renderForm()
    mountedRoots.push(view)

    expect(view.container.textContent).toContain('General information')
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

  it('disables Save Changes while submitting', async () => {
    const deferred = createDeferred<EditProfileFormValues>()
    const onSubmitAction = vi.fn().mockReturnValue(deferred.promise)
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
    expect(view.container.querySelector('button[type="submit"]')).toBeDisabled()
    expect(view.container.querySelector('button[type="submit"]')).toHaveAttribute(
      'aria-busy',
      'true',
    )

    await act(async () => {
      deferred.resolve(initialValues)
    })

    await waitFor(() =>
      expect(view.container.querySelector('button[type="submit"]')).toBeDisabled(),
    )
  })

  it('keeps values and allows a successful retry after a submit error', async () => {
    const savedValues = { ...initialValues, username: 'saved-user' }
    const onSubmitAction = vi
      .fn()
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValueOnce(savedValues)
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

    await submitForm(form)

    await waitFor(() => expect(onSubmitAction).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(usernameInput).toHaveValue('saved-user'))
    expect(view.container.querySelector('[role="alert"]')).toBeNull()
  })

  it('updates City options and clears City when Country changes', async () => {
    const locationInitialValues = {
      ...initialValues,
      city: 'moscow',
      country: 'russia',
    }
    const view = await renderForm({
      cityOptionsByCountryValue: {
        belarus: [{ label: 'Minsk', value: 'minsk' }],
        russia: [{ label: 'Moscow', value: 'moscow' }],
      },
      countryOptions: [
        { label: 'Belarus', value: 'belarus' },
        { label: 'Russia', value: 'russia' },
      ],
      initialValues: locationInitialValues,
    })
    mountedRoots.push(view)
    const countrySelect = view.container.querySelector('select[aria-label="Select your country"]')
    const citySelect = view.container.querySelector('select[aria-label="Select your city"]')

    if (
      !(countrySelect instanceof HTMLSelectElement) ||
      !(citySelect instanceof HTMLSelectElement)
    ) {
      throw new Error('Expected Country and City selects.')
    }

    expect(citySelect).toHaveValue('moscow')
    await setSelectValue(countrySelect, 'belarus')

    expect(citySelect).toHaveValue('')
    expect(citySelect.textContent).toContain('Minsk')
    expect(citySelect.textContent).not.toContain('Moscow')

    await setSelectValue(countrySelect, '')

    expect(citySelect).toBeDisabled()
  })
})
