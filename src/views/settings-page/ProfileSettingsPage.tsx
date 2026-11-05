'use client'

import { updateProfile } from '@/entities/user/current-user'
import { useSession } from '@/features/auth/session-management'
import {
  EditProfileForm,
  getEditProfileValues,
  getUpdateProfileInput,
  type EditProfileFormProps,
} from '@/features/edit-profile'

export function ProfileSettingsPage() {
  const { status, user, createCurrentUserSynchronizer } = useSession()
  if (status !== 'authenticated' || !user) return null

  const saveProfile: EditProfileFormProps['onSubmitAction'] = async (values, dirtyFields) => {
    const synchronize = createCurrentUserSynchronizer()
    const updated = await updateProfile(getUpdateProfileInput(values, dirtyFields))
    if (!synchronize(updated)) throw new Error('The session changed while saving the profile.')
    return getEditProfileValues(updated)
  }
  const countryName = user.country?.name ?? user.country?.nameRu
  const cityName = user.city?.name ?? user.city?.nameRu
  const countryOptions =
    user.countryId && countryName ? [{ value: user.countryId, label: countryName }] : []
  const cityOptions = user.cityId && cityName ? [{ value: user.cityId, label: cityName }] : []

  return (
    <EditProfileForm
      key={user.id}
      initialValues={getEditProfileValues(user)}
      onSubmitAction={saveProfile}
      countryOptions={countryOptions}
      cityOptionsByCountryValue={user.countryId ? { [user.countryId]: cityOptions } : {}}
      locationDisabled
    />
  )
}
