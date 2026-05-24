import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import '@/app/globals.css'

import { Recaptcha } from './Recaptcha'

const meta = {
  title: 'Shared/Recaptcha',
  component: Recaptcha,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 24,
          background: 'var(--color-dark-900)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Recaptcha>

export default meta

type Story = StoryObj<typeof Recaptcha>

export const Interactive: Story = {
  args: {
    defaultChecked: false,
  },
}

export const Default: Story = {
  args: {
    status: 'default',
  },
}

export const Hover: Story = {
  args: {
    status: 'hover',
  },
}

export const Checked: Story = {
  args: {
    status: 'checked',
  },
}

export const Loading: Story = {
  args: {
    status: 'loading',
  },
}

export const Error: Story = {
  args: {
    status: 'error',
  },
}

export const Expired: Story = {
  args: {
    status: 'expired',
  },
}
