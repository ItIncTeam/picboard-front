import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EditProfileForm, type EditProfileFormValues } from '@/features/edit-profile'
import type { SelectOption } from '@/shared/ui/select'

const countryOptions: SelectOption[] = [
  { label: 'Belarus', value: 'belarus' },
  { label: 'Russia', value: 'russia' },
]

const cityOptionsByCountryValue: Record<string, SelectOption[]> = {
  belarus: [{ label: 'Minsk', value: 'minsk' }],
  russia: [
    { label: 'Moscow', value: 'moscow' },
    { label: 'Saint Petersburg', value: 'saint-petersburg' },
  ],
}

const initialValues: EditProfileFormValues = {
  aboutMe: 'I enjoy photography and travelling.',
  city: 'moscow',
  country: 'russia',
  dateOfBirth: new Date(1989, 11, 12),
  firstName: 'Sveta',
  lastName: 'Ivanova',
  username: 'Usertest',
}

const meta = {
  title: 'Features/EditProfile/EditProfileForm',
  component: EditProfileForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EditProfileForm>

export default meta
type Story = StoryObj<typeof EditProfileForm>

export const Default: Story = {
  args: {
    cityOptionsByCountryValue,
    countryOptions,
    initialValues,
    onSubmitAction: async (values) => values,
  },
}
