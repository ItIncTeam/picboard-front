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
    isRegistered: false,
  },
}

export const Registered: Story = {
  args: {
    isRegistered: true,
  },
}

export const WithMessages: Story = {
  args: {
    isRegistered: true,
    messageCount: 3,
  },
}

export const SuperAdmin: Story = {
  args: {
    isRegistered: true,
    role: 'superAdmin',
  },
}
