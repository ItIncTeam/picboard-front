import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DatePicker } from './DatePicker'

const meta = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#000000' }],
    },
  },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  args: {
    value: new Date(2023, 10, 11),
  },
}

export const Active: Story = {
  args: {
    defaultOpen: true,
    value: new Date(2023, 10, 11),
  },
}

export const Error: Story = {
  args: {
    errorMessage: 'Incorrect date',
    value: new Date(2023, 10, 11),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: new Date(2023, 10, 11),
  },
}

export const RangeActive: Story = {
  args: {
    defaultOpen: true,
    mode: 'range',
    value: {
      from: new Date(2023, 9, 28),
      to: new Date(2023, 10, 10),
    },
  },
}
