import type { SelectOption } from '@/shared/ui/select'

export type EditProfileFormValues = {
  username: string
  firstName: string
  lastName: string
  dateOfBirth: Date | null
  country: string
  city: string
  aboutMe: string
}

export type EditProfileFormProps = {
  initialValues: EditProfileFormValues
  countryOptions: SelectOption[]
  cityOptionsByCountryValue: Record<string, SelectOption[]>
  onSubmitAction: (values: EditProfileFormValues) => Promise<EditProfileFormValues>
}
