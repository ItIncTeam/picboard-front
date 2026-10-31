'use client'

import { useCallback, useMemo } from 'react'

import { type City, type Country, updateProfile } from '@/entities/user/current-user'
import {
  EditProfileForm,
  mapCurrentUserToEditProfileFormValues,
  mapEditProfileFormValuesToUpdateProfileInput,
  type EditProfileFormValues,
} from '@/features/edit-profile'
import { useSession } from '@/features/auth/session-management'
import { useI18n } from '@/shared/lib/i18n'
import type { SelectOption } from '@/shared/ui/select'

const getLocationLabel = (
  location: Pick<Country, 'name' | 'nameRu'> | City,
  language: 'en' | 'ru',
): string | null => {
  const preferredName = language === 'ru' ? location.nameRu : location.name
  const fallbackName = language === 'ru' ? location.name : location.nameRu

  return preferredName ?? fallbackName
}

const getSelectedLocationOptions = (
  country: Country | null,
  city: City | null,
  language: 'en' | 'ru',
): {
  cityOptionsByCountryValue: Record<string, SelectOption[]>
  countryOptions: SelectOption[]
} => {
  const countryLabel = country ? getLocationLabel(country, language) : null
  const cityLabel = city ? getLocationLabel(city, language) : null
  const countryOptions =
    country?.id && countryLabel ? [{ label: countryLabel, value: country.id }] : []
  const cityOptionsByCountryValue =
    country?.id && city?.id && cityLabel
      ? { [country.id]: [{ label: cityLabel, value: city.id }] }
      : {}

  return { cityOptionsByCountryValue, countryOptions }
}

export function SettingsProfilePage() {
  const { createCurrentUserSynchronizer, user } = useSession()
  const { language, t } = useI18n()

  const initialValues = useMemo(
    () => (user ? mapCurrentUserToEditProfileFormValues(user) : null),
    [user],
  )
  const locationOptions = useMemo(
    () => getSelectedLocationOptions(user?.country ?? null, user?.city ?? null, language),
    [language, user?.city, user?.country],
  )
  const submitProfile = useCallback(
    async (values: EditProfileFormValues): Promise<EditProfileFormValues> => {
      const synchronizeCurrentUser = createCurrentUserSynchronizer()
      const savedUser = await updateProfile(mapEditProfileFormValuesToUpdateProfileInput(values))

      synchronizeCurrentUser(savedUser)

      return mapCurrentUserToEditProfileFormValues(savedUser)
    },
    [createCurrentUserSynchronizer],
  )

  if (!initialValues) {
    return <p role="status">{t.auth.session.loading}</p>
  }

  return (
    <EditProfileForm
      cityOptionsByCountryValue={locationOptions.cityOptionsByCountryValue}
      countryOptions={locationOptions.countryOptions}
      initialValues={initialValues}
      onSubmitAction={submitProfile}
    />
  )
}
