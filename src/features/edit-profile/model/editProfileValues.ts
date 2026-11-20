import type { CurrentUser, UpdateProfileInput } from '@/entities/user/current-user'

import type { EditProfileDirtyFields, EditProfileFormValues } from './types'

export function getEditProfileValues(user: CurrentUser): EditProfileFormValues {
  return {
    username: user.username,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    aboutMe: user.aboutMe ?? '',
    country: user.countryId ?? '',
    city: user.cityId ?? '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth.slice(0, 10) + 'T00:00:00') : null,
  }
}

export function getUpdateProfileInput(
  values: EditProfileFormValues,
  dirtyFields: EditProfileDirtyFields,
): UpdateProfileInput {
  const input: UpdateProfileInput = {
    username: values.username.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  }
  const date = values.dateOfBirth
  const dateOfBirth = date
    ? [
        String(date.getFullYear()).padStart(4, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')
    : null
  const aboutMe = values.aboutMe.trim()

  if (dirtyFields.dateOfBirth) input.dateOfBirth = dateOfBirth
  if (dirtyFields.aboutMe) input.aboutMe = aboutMe || null
  if (dirtyFields.country || dirtyFields.city) {
    input.countryId = values.country || null
    input.cityId = values.city || null
  }

  return input
}
