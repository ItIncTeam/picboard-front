import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Header } from './Header'

const meta = {
  title: 'Widgets/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>

export default meta

type Story = StoryObj<typeof Header>

export const Public: Story = {
  args: {
    role: 'guest',
  },
}

export const User: Story = {
  args: {
    role: 'user',
  },
}

export const WithNotifications: Story = {
  args: {
    role: 'user',
    notificationsCount: 3,
  },
}

export const SuperAdmin: Story = {
  args: {
    role: 'superAdmin',
  },
}
