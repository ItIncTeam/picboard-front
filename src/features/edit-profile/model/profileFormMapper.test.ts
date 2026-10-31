import { describe, expect, it } from 'vitest'

import type { CurrentUser } from '@/entities/user/current-user'

import {
  mapCurrentUserToEditProfileFormValues,
  mapEditProfileFormValuesToUpdateProfileInput,
} from './profileFormMapper'

const currentUser: CurrentUser = {
  aboutMe: null,
  avatar: null,
  city: null,
  cityId: null,
  country: null,
  countryId: null,
  dateOfBirth: null,
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  firstName: null,
  id: 'user-1',
  isConfirmed: true,
  lastName: null,
  profilePictureFileId: null,
  username: 'jane_doe',
}

describe('profile form mapper', () => {
  it('maps nullable profile values to form defaults', () => {
    expect(mapCurrentUserToEditProfileFormValues(currentUser)).toEqual({
      aboutMe: '',
      city: '',
      country: '',
      dateOfBirth: null,
      firstName: '',
      lastName: '',
      username: 'jane_doe',
    })
  })

  it('preserves a date of birth as a local calendar date', () => {
    const values = mapCurrentUserToEditProfileFormValues({
      ...currentUser,
      dateOfBirth: '2000-05-17',
    })

    expect(values.dateOfBirth?.getFullYear()).toBe(2000)
    expect(values.dateOfBirth?.getMonth()).toBe(4)
    expect(values.dateOfBirth?.getDate()).toBe(17)
  })

  it('maps form values to the update input and clears empty optional fields', () => {
    expect(
      mapEditProfileFormValuesToUpdateProfileInput({
        aboutMe: '   ',
        city: '',
        country: '',
        dateOfBirth: null,
        firstName: ' Jane ',
        lastName: ' Doe ',
        username: ' jane_doe ',
      }),
    ).toEqual({
      aboutMe: null,
      cityId: null,
      countryId: null,
      dateOfBirth: null,
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane_doe',
    })
  })

  it('serializes selected location IDs and the date without a timezone shift', () => {
    expect(
      mapEditProfileFormValuesToUpdateProfileInput({
        aboutMe: 'Photographer',
        city: 'city-1',
        country: 'country-1',
        dateOfBirth: new Date(2000, 4, 17),
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'jane_doe',
      }),
    ).toEqual({
      aboutMe: 'Photographer',
      cityId: 'city-1',
      countryId: 'country-1',
      dateOfBirth: '2000-05-17',
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane_doe',
    })
  })
})
