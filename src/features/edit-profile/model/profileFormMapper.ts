import type { CurrentUser, UpdateProfileInput } from '@/entities/user/current-user'

import type { EditProfileFormValues } from './types'

const emptyValueToNull = (value: string): string | null => {
  const normalizedValue = value.trim()

  return normalizedValue || null
}

const toCalendarDate = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    throw new Error('Date of birth must use the YYYY-MM-DD format.')
  }

  const [, yearValue, monthValue, dayValue] = match
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('Date of birth must be a valid calendar date.')
  }

  return date
}

const toIsoCalendarDate = (value: Date): string => {
  const year = value.getFullYear().toString().padStart(4, '0')
  const month = (value.getMonth() + 1).toString().padStart(2, '0')
  const day = value.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function mapCurrentUserToEditProfileFormValues(user: CurrentUser): EditProfileFormValues {
  return {
    aboutMe: user.aboutMe ?? '',
    city: user.cityId ?? '',
    country: user.countryId ?? '',
    dateOfBirth: user.dateOfBirth ? toCalendarDate(user.dateOfBirth) : null,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    username: user.username,
  }
}

export function mapEditProfileFormValuesToUpdateProfileInput(
  values: EditProfileFormValues,
): UpdateProfileInput {
  return {
    aboutMe: emptyValueToNull(values.aboutMe),
    cityId: emptyValueToNull(values.city),
    countryId: emptyValueToNull(values.country),
    dateOfBirth: values.dateOfBirth ? toIsoCalendarDate(values.dateOfBirth) : null,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    username: values.username.trim(),
  }
}
