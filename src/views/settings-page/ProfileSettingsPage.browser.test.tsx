import type { ApolloLink } from '@apollo/client/core'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { meQuery, writeCurrentUserCache, type CurrentUser } from '@/entities/user/current-user'
import {
  SessionProvider,
  useSession,
  type SessionContextValue,
} from '@/features/auth/session-management'
import { apolloClient } from '@/shared/api'
import {
  clearAccessToken,
  getAccessToken,
  notifyAuthSessionExpired,
  setAccessToken,
} from '@/shared/lib/auth'
import { I18nProvider } from '@/shared/lib/i18n'
import { ProfileSettingsPage } from './ProfileSettingsPage'

const api = vi.hoisted(() => ({
  getMe: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  request: vi.fn(),
}))
vi.mock('@/features/auth/session-management/api', () => ({
  getMe: api.getMe,
  refreshToken: api.refreshToken,
  logout: api.logout,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/widgets/doc-modal', () => ({ DocModal: () => <div role="dialog">Privacy Policy</div> }))
vi.mock('@/shared/api', async () => {
  const { ApolloClient, ApolloLink, InMemoryCache, Observable } =
    await import('@apollo/client/core')
  return {
    apolloClient: new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        (operation) =>
          new Observable((observer) => {
            void api.request(operation).then(
              (result: ApolloLink.Result) => {
                observer.next(result)
                observer.complete()
              },
              (error: unknown) => observer.error(error),
            )
          }),
      ),
    }),
  }
})

const user: CurrentUser & { __typename: string } = {
  __typename: 'Me',
  id: 'owner',
  username: 'username',
  email: 'user@example.com',
  isConfirmed: true,
  firstName: 'Anna',
  lastName: "O'Neil",
  displayName: 'Anna ONeil',
  aboutMe: 'Bio',
  dateOfBirth: '2000-05-17',
  countryId: 'country-id',
  cityId: 'city-id',
  country: { id: 'country-id', code: 'DE', name: 'Germany', nameRu: null },
  city: { id: 'city-id', name: 'Berlin', nameRu: null },
  avatar: null,
  profilePictureFileId: null,
}
let session: SessionContextValue
function Probe() {
  const value = useSession()
  useEffect(() => {
    session = value
  }, [value])
  return <ProfileSettingsPage />
}

async function waitFor(assertion: () => void): Promise<void> {
  let error: unknown
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      assertion()
      return
    } catch (caught) {
      error = caught
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  }
  throw error
}

async function changeInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('Edit Profile settings integration', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    api.refreshToken.mockResolvedValue({ accessToken: 'existing-token' })
    api.getMe.mockResolvedValue(user)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    apolloClient.cache.restore({})
    vi.resetAllMocks()
    clearAccessToken()
  })
  async function render(initial = user): Promise<void> {
    api.getMe.mockResolvedValueOnce(initial)
    writeCurrentUserCache(initial)
    await act(async () => {
      root.render(
        <I18nProvider>
          <SessionProvider>
            <Probe />
          </SessionProvider>
        </I18nProvider>,
      )
    })
    await waitFor(() => expect(container.querySelector('input[name="username"]')).not.toBeNull())
  }
  function username(): HTMLInputElement {
    return container.querySelector<HTMLInputElement>('input[name="username"]')!
  }
  async function submit(): Promise<void> {
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  }

  it('prefills real profile/location values and synchronizes the saved response without extra Me requests', async () => {
    await render()
    expect(username()).toHaveValue('username')
    expect(container.querySelector('input[name="lastName"]')).toHaveValue("O'Neil")
    expect(container.textContent).toContain('Germany')
    expect(container.textContent).toContain('Berlin')
    container
      .querySelectorAll('[role="combobox"]')
      .forEach((select) => expect(select).toBeDisabled())
    const updated = { ...user, username: 'saved_name', firstName: 'Anna-Maria', aboutMe: null }
    api.request.mockResolvedValueOnce({ data: { updateProfile: updated } })
    await changeInput(username(), 'updated!name')
    await changeInput(
      container.querySelector<HTMLInputElement>('input[name="firstName"]')!,
      ' Anna-Maria ',
    )
    await changeInput(container.querySelector('textarea')!, '')
    await submit()
    await waitFor(() => expect(username()).toHaveValue('saved_name'))
    expect(api.request).toHaveBeenCalledTimes(1)
    expect(api.request.mock.calls[0][0].operationName).toBe('UpdateProfile')
    expect(api.request.mock.calls[0][0].variables).toEqual({
      input: {
        username: 'updated!name',
        firstName: 'Anna-Maria',
        lastName: "O'Neil",
        aboutMe: null,
      },
    })
    expect(session.user).toEqual(updated)
    expect(apolloClient.readQuery({ query: meQuery })).toMatchObject({ me: updated })
    expect(container.querySelector('textarea')).toHaveValue('')
    expect(container.querySelector('button[type="submit"]')).toBeDisabled()
    expect(api.getMe).toHaveBeenCalledTimes(1)
    expect(api.refreshToken).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('existing-token')
  })

  it('ignores overlapping submissions while one mutation is in flight', async () => {
    await render()
    const pending = Promise.withResolvers<ApolloLink.Result>()
    api.request.mockReturnValue(pending.promise)
    await changeInput(username(), 'draft_name')
    try {
      await act(async () => {
        const form = container.querySelector('form')!
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
      expect(api.request).toHaveBeenCalledTimes(1)
      container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled())
      expect(container.querySelector('textarea')).toBeDisabled()
      expect(container.querySelector('button[type="submit"]')).toHaveAttribute('aria-busy', 'true')
    } finally {
      await act(async () => {
        pending.resolve({ data: { updateProfile: { ...user, username: 'saved_name' } } })
        await pending.promise
      })
    }
  })

  it('leaves saved location IDs out of a draft submitted after a profile refresh', async () => {
    await render()
    await changeInput(username(), 'draft_name')
    const refreshed = {
      ...user,
      countryId: 'new-country',
      cityId: 'new-city',
      country: { id: 'new-country', code: 'FR', name: 'France', nameRu: null },
      city: { id: 'new-city', name: 'Paris', nameRu: null },
    }
    await act(async () => {
      expect(session.createCurrentUserSynchronizer()(refreshed)).toBe(true)
    })
    api.request.mockResolvedValueOnce({
      data: { updateProfile: { ...refreshed, username: 'saved_name' } },
    })
    await submit()
    await waitFor(() => expect(username()).toHaveValue('saved_name'))
    const input = api.request.mock.calls[0][0].variables.input
    expect(input).not.toHaveProperty('countryId')
    expect(input).not.toHaveProperty('cityId')
    expect(session.user?.countryId).toBe('new-country')
    expect(session.user?.cityId).toBe('new-city')
  })

  it('clears a populated date with null and prefills nullable names without placeholders', async () => {
    await render({
      ...user,
      firstName: null,
      lastName: null,
      aboutMe: null,
      countryId: null,
      cityId: null,
      country: null,
      city: null,
    })
    expect(container.querySelector('input[name="firstName"]')).toHaveValue('')
    await changeInput(container.querySelector<HTMLInputElement>('input[name="firstName"]')!, 'Anna')
    await changeInput(container.querySelector<HTMLInputElement>('input[name="lastName"]')!, 'Smith')
    const clear = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Clear date of birth',
    )!
    await act(async () => clear.click())
    api.request.mockResolvedValueOnce({
      data: { updateProfile: { ...user, firstName: 'Anna', lastName: 'Smith', dateOfBirth: null } },
    })
    await submit()
    await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
    expect(api.request.mock.calls[0][0].variables.input).toEqual({
      username: 'username',
      firstName: 'Anna',
      lastName: 'Smith',
      dateOfBirth: null,
    })
  })

  it.each([
    { code: 'USERNAME_TAKEN', field: 'username', message: 'This username is already taken.' },
    { code: 'USER_UNDER_13', field: 'dateOfBirth', message: 'You must be at least 13 years old.' },
    {
      code: 'CITY_NOT_IN_COUNTRY',
      field: 'city',
      message: 'The city must belong to the selected country.',
    },
    { code: 'BAD_USER_INPUT', field: 'firstName', message: 'Backend name validation' },
  ])(
    'maps $code to RHF while preserving drafts and current user',
    async ({ code, field, message }) => {
      await render()
      const snapshot = apolloClient.cache.extract()
      api.request.mockResolvedValueOnce({
        errors: [
          {
            message: 'Do not infer fields from this text',
            extensions: {
              code,
              ...(code === 'BAD_USER_INPUT' ? { errors: [{ field, message }] } : {}),
            },
          },
        ],
      })
      await changeInput(username(), 'draft_name')
      await submit()
      await waitFor(() => expect(container.textContent).toContain(message))
      expect(username()).toHaveValue('draft_name')
      expect(session.user).toEqual(user)
      expect(apolloClient.cache.extract()).toEqual(snapshot)
      if (code === 'USER_UNDER_13') {
        const privacy = Array.from(container.querySelectorAll('button')).find(
          (button) => button.textContent === 'Privacy Policy',
        )!
        await act(async () => privacy.click())
        expect(container.querySelector('[role="dialog"]')).not.toBeNull()
      }
    },
  )

  it('preserves drafts on transport failure and resets them after retry', async () => {
    await render()
    api.request
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ data: { updateProfile: { ...user, username: 'saved_name' } } })
    await changeInput(username(), 'draft_name')
    await submit()
    await waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
    expect(username()).toHaveValue('draft_name')
    expect(session.user).toEqual(user)
    await submit()
    await waitFor(() => expect(username()).toHaveValue('saved_name'))
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it.each(['logout', 'expiration', 'user-switch', 'same-user-login'])(
    'discards late results after $0',
    async (transition) => {
      await render()
      const pending = Promise.withResolvers<ApolloLink.Result>()
      api.request.mockReturnValueOnce(pending.promise)
      await changeInput(username(), 'draft_name')
      await submit()
      await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
      await act(async () => {
        if (transition === 'logout') {
          api.logout.mockResolvedValueOnce('Logged out')
          await session.logout()
        } else if (transition === 'expiration') notifyAuthSessionExpired()
        else {
          setAccessToken('new-token')
          api.getMe.mockResolvedValueOnce(
            transition === 'user-switch'
              ? { ...user, id: 'other-owner', username: 'other_name' }
              : user,
          )
          await session.authenticateWithCurrentToken()
        }
      })
      const expectedUser = session.user
      const snapshot = apolloClient.cache.extract()
      await act(async () => {
        pending.resolve({ data: { updateProfile: { ...user, username: 'late_name' } } })
        await pending.promise
      })
      await waitFor(() => expect(session.user).toEqual(expectedUser))
      expect(apolloClient.cache.extract()).toEqual(snapshot)
      if (transition === 'same-user-login') {
        await waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
        expect(username()).toHaveValue('draft_name')
      } else if (transition === 'user-switch') expect(username()).toHaveValue('other_name')
      else expect(container.querySelector('form')).toBeNull()
    },
  )
})
