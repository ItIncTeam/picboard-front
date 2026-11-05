import { describe, expect, it } from 'vitest'
import type { CurrentUser } from '@/entities/user/current-user'
import { getEditProfileValues, getUpdateProfileInput } from './editProfileValues'

const user: CurrentUser = {
  id: 'owner',
  username: 'username',
  email: 'user@example.com',
  isConfirmed: true,
  firstName: null,
  lastName: null,
  displayName: null,
  aboutMe: null,
  dateOfBirth: null,
  countryId: null,
  cityId: null,
  country: null,
  city: null,
  avatar: null,
  profilePictureFileId: null,
}

describe('Edit Profile backend mapping', () => {
  it('prefills nullable fields without inventing values and omits unchanged optional fields', () => {
    const values = getEditProfileValues(user)
    expect(values).toEqual({
      username: 'username',
      firstName: '',
      lastName: '',
      aboutMe: '',
      dateOfBirth: null,
      country: '',
      city: '',
    })
    expect(
      getUpdateProfileInput({ ...values, firstName: ' Anna-Maria ', lastName: " O'Neil " }, {}),
    ).toEqual({ username: 'username', firstName: 'Anna-Maria', lastName: "O'Neil" })
  })

  it('round-trips calendar dates and formats local midnight without an ISO timezone shift', () => {
    const existing = { ...user, dateOfBirth: '2000-05-17T00:00:00.000Z' }
    const values = getEditProfileValues(existing)
    expect(values.dateOfBirth).toEqual(new Date(2000, 4, 17))
    expect(getUpdateProfileInput(values, {})).not.toHaveProperty('dateOfBirth')
    expect(
      getUpdateProfileInput({ ...values, dateOfBirth: new Date(2001, 0, 2) }, { dateOfBirth: true })
        .dateOfBirth,
    ).toBe('2001-01-02')
  })

  it('sends null to clear populated optional fields and keeps location IDs paired', () => {
    const existing = {
      ...user,
      aboutMe: 'Bio',
      dateOfBirth: '2000-05-17',
      countryId: 'country',
      cityId: 'city',
    }
    const values = getEditProfileValues(existing)
    expect(
      getUpdateProfileInput(
        { ...values, aboutMe: ' ', dateOfBirth: null, country: '', city: '' },
        { aboutMe: true, dateOfBirth: true, country: true, city: true },
      ),
    ).toEqual({
      username: 'username',
      firstName: '',
      lastName: '',
      aboutMe: null,
      dateOfBirth: null,
      countryId: null,
      cityId: null,
    })
    expect(
      getUpdateProfileInput({ ...values, country: 'new-country', city: '' }, { country: true }),
    ).toMatchObject({ countryId: 'new-country', cityId: null })
  })
})
