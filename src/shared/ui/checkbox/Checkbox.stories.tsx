import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import '@/app/globals.css'

import { Checkbox } from './Checkbox'

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 24,
          background: 'var(--color-dark-700)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'I agree to the Terms of Service',
  },
}

export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
}

export const DisabledWithLabel: Story = {
  args: {
    label: 'Disabled option',
    disabled: true,
    defaultChecked: true,
  },
}
