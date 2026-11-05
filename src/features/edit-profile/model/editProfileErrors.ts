import { CombinedGraphQLErrors } from '@apollo/client/errors'
import type { Dictionary } from '@/shared/lib/i18n/dictionaries'

import type { EditProfileFormValues } from './types'

type FieldError = { field: keyof EditProfileFormValues; message: string; type: string }
const fields = new Map<string, keyof EditProfileFormValues>([
  ['username', 'username'],
  ['firstName', 'firstName'],
  ['lastName', 'lastName'],
  ['dateOfBirth', 'dateOfBirth'],
  ['aboutMe', 'aboutMe'],
  ['countryId', 'country'],
  ['cityId', 'city'],
])

export function getEditProfileErrors(
  error: unknown,
  messages: Dictionary['profile']['edit'],
): FieldError[] {
  if (!CombinedGraphQLErrors.is(error)) return []

  const fallbacks = new Map<string, FieldError>([
    ['USERNAME_TAKEN', { field: 'username', message: messages.usernameTaken, type: 'server' }],
    [
      'USER_UNDER_13',
      { field: 'dateOfBirth', message: messages.dateOfBirthTooYoung, type: 'minimumAge' },
    ],
    ['CITY_NOT_IN_COUNTRY', { field: 'city', message: messages.cityNotInCountry, type: 'server' }],
  ])

  return error.errors.flatMap(({ extensions }) => {
    const code = extensions?.code
    if (typeof code !== 'string') return []
    const fallback = fallbacks.get(code)
    if (!fallback && code !== 'BAD_USER_INPUT') return []
    const result: FieldError[] = []
    if (Array.isArray(extensions?.errors)) {
      for (const candidate of extensions.errors as unknown[]) {
        if (typeof candidate !== 'object' || candidate === null) continue
        const detail = candidate as Record<string, unknown>
        if (typeof detail.field !== 'string' || typeof detail.message !== 'string') continue
        const field = fields.get(detail.field)
        if (field)
          result.push({
            field,
            message: detail.message,
            type: code === 'USER_UNDER_13' && field === 'dateOfBirth' ? 'minimumAge' : 'server',
          })
      }
    }
    if (fallback && !result.some(({ field }) => field === fallback.field)) result.push(fallback)
    return result
  })
}
