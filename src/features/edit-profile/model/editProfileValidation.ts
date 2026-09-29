type ValidationResult = true | string

export type EditProfileValidationMessages = {
  aboutMeTooLong: string
  dateOfBirthInFuture: string
  dateOfBirthTooYoung: string
  firstNameInvalid: string
  firstNameLength: string
  lastNameInvalid: string
  lastNameLength: string
  requiredField: string
  usernameInvalid: string
  usernameLength: string
}

type EditProfileValidationRules = {
  aboutMe: {
    validate: (value: string) => ValidationResult
  }
  dateOfBirth: {
    validate: {
      minimumAge: (value: Date | null) => ValidationResult
      notInFuture: (value: Date | null) => ValidationResult
    }
  }
  firstName: {
    validate: (value: string) => ValidationResult
  }
  lastName: {
    validate: (value: string) => ValidationResult
  }
  username: {
    validate: (value: string) => ValidationResult
  }
}

const usernamePattern = /^[A-Za-z0-9_-]+$/
const namePattern = /^[A-Za-zА-Яа-яЁё]+$/

const getTrimmedValue = (value: string): string => value.trim()

const hasLengthBetween = (value: string, minLength: number, maxLength: number): boolean => {
  return value.length >= minLength && value.length <= maxLength
}

const compareCalendarDates = (left: Date, right: Date): number => {
  const leftCalendarDate = new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime()
  const rightCalendarDate = new Date(
    right.getFullYear(),
    right.getMonth(),
    right.getDate(),
  ).getTime()

  return leftCalendarDate - rightCalendarDate
}

export const isAtLeastAge = (dateOfBirth: Date, minimumAge: number, today: Date): boolean => {
  const yearsDifference = today.getFullYear() - dateOfBirth.getFullYear()
  const birthdayHasPassed =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate())

  return yearsDifference - (birthdayHasPassed ? 0 : 1) >= minimumAge
}

export const createEditProfileValidationRules = (
  messages: EditProfileValidationMessages,
  today: Date = new Date(),
): EditProfileValidationRules => ({
  username: {
    validate: (value) => {
      const normalizedValue = getTrimmedValue(value)

      if (!normalizedValue) {
        return messages.requiredField
      }

      if (!hasLengthBetween(normalizedValue, 6, 30)) {
        return messages.usernameLength
      }

      return usernamePattern.test(normalizedValue) || messages.usernameInvalid
    },
  },
  firstName: {
    validate: (value) => {
      const normalizedValue = getTrimmedValue(value)

      if (!normalizedValue) {
        return messages.requiredField
      }

      if (!hasLengthBetween(normalizedValue, 1, 50)) {
        return messages.firstNameLength
      }

      return namePattern.test(normalizedValue) || messages.firstNameInvalid
    },
  },
  lastName: {
    validate: (value) => {
      const normalizedValue = getTrimmedValue(value)

      if (!normalizedValue) {
        return messages.requiredField
      }

      if (!hasLengthBetween(normalizedValue, 1, 50)) {
        return messages.lastNameLength
      }

      return namePattern.test(normalizedValue) || messages.lastNameInvalid
    },
  },
  dateOfBirth: {
    validate: {
      notInFuture: (value) => {
        if (!value) {
          return true
        }

        return compareCalendarDates(value, today) <= 0 || messages.dateOfBirthInFuture
      },
      minimumAge: (value) => {
        if (!value || compareCalendarDates(value, today) > 0) {
          return true
        }

        return isAtLeastAge(value, 13, today) || messages.dateOfBirthTooYoung
      },
    },
  },
  aboutMe: {
    validate: (value) => value.length <= 200 || messages.aboutMeTooLong,
  },
})
