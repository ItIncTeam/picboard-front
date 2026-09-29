import { describe, expect, it } from 'vitest'

import { createEditProfileValidationRules, isAtLeastAge } from './editProfileValidation'

const messages = {
  aboutMeTooLong: 'about-me-too-long',
  dateOfBirthInFuture: 'date-of-birth-in-future',
  dateOfBirthTooYoung: 'date-of-birth-too-young',
  firstNameInvalid: 'first-name-invalid',
  firstNameLength: 'first-name-length',
  lastNameInvalid: 'last-name-invalid',
  lastNameLength: 'last-name-length',
  requiredField: 'required',
  usernameInvalid: 'username-invalid',
  usernameLength: 'username-length',
}

const today = new Date(2026, 8, 22)
const rules = createEditProfileValidationRules(messages, today)

describe('edit profile validation', () => {
  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['short', 'username-length'],
    ['a'.repeat(31), 'username-length'],
    ['user name', 'username-invalid'],
    ['пользователь', 'username-invalid'],
    ['user_name-12', true],
    ['  user_name-12  ', true],
  ])('validates username %j', (value, expectedResult) => {
    expect(rules.username.validate(value)).toBe(expectedResult)
  })

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['A'.repeat(51), 'first-name-length'],
    ['Анна', true],
    ['Anna', true],
    ['Anna1', 'first-name-invalid'],
  ])('validates first name %j', (value, expectedResult) => {
    expect(rules.firstName.validate(value)).toBe(expectedResult)
  })

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['Иванова', true],
    ['Ivanova', true],
    ['Иванова-1', 'last-name-invalid'],
    ['A'.repeat(51), 'last-name-length'],
  ])('validates last name %j', (value, expectedResult) => {
    expect(rules.lastName.validate(value)).toBe(expectedResult)
  })

  it.each([
    ['', true],
    ['A'.repeat(200), true],
    ['A'.repeat(201), 'about-me-too-long'],
  ])('validates About Me length', (value, expectedResult) => {
    expect(rules.aboutMe.validate(value)).toBe(expectedResult)
  })

  it('validates date of birth against calendar boundaries', () => {
    expect(rules.dateOfBirth.validate.notInFuture(null)).toBe(true)
    expect(rules.dateOfBirth.validate.notInFuture(new Date(2026, 8, 23))).toBe(
      'date-of-birth-in-future',
    )
    expect(rules.dateOfBirth.validate.minimumAge(new Date(2013, 8, 22))).toBe(true)
    expect(rules.dateOfBirth.validate.minimumAge(new Date(2013, 8, 23))).toBe(
      'date-of-birth-too-young',
    )
  })

  it('handles a leap-day birthday by calendar date', () => {
    const dateOfBirth = new Date(2012, 1, 29)

    expect(isAtLeastAge(dateOfBirth, 13, new Date(2025, 1, 28))).toBe(false)
    expect(isAtLeastAge(dateOfBirth, 13, new Date(2025, 2, 1))).toBe(true)
  })
})
