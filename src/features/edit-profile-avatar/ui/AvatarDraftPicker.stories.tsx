import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AvatarDraftPicker } from './AvatarDraftPicker'

const meta = {
  title: 'Features/EditProfileAvatar/AvatarDraftPicker',
  component: AvatarDraftPicker,
  tags: ['autodocs'],
} satisfies Meta<typeof AvatarDraftPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
