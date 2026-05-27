import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from './Checkbox'

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
