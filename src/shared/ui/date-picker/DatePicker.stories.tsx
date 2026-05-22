import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DatePicker } from './DatePicker'

const selectedRange = {
  from: new Date(2023, 9, 28),
  to: new Date(2023, 10, 10),
}

const mockToday = new Date(2023, 10, 11)

const meta = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#000000' }],
    },
    docs: {
      description: {
        component:
          'Use `value` and `onValueChange` to connect DatePicker to forms. Single mode returns `Date`; range mode returns `{ from, to }`. Convert dates to ISO strings before sending them to API.',
      },
    },
  },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  args: {
    label: 'Date select',
    value: new Date(2022, 11, 22),
  },
}

export const Hover: Story = {
  args: {
    state: 'hover',
    value: new Date(2022, 11, 22),
  },
}

export const Focus: Story = {
  args: {
    state: 'focus',
    value: new Date(2022, 11, 22),
  },
}

export const Active: Story = {
  args: {
    defaultOpen: true,
    today: mockToday,
    value: mockToday,
  },
}

export const Error: Story = {
  args: {
    state: 'error',
    value: new Date(2022, 11, 22),
  },
}

export const Disabled: Story = {
  args: {
    state: 'disabled',
    value: new Date(2022, 11, 22),
  },
}

export const RangeDefault: Story = {
  args: {
    mode: 'range',
    value: selectedRange,
  },
}

export const RangeHover: Story = {
  args: {
    mode: 'range',
    state: 'hover',
    value: selectedRange,
  },
}

export const RangeFocus: Story = {
  args: {
    mode: 'range',
    state: 'focus',
    value: selectedRange,
  },
}

export const RangeActive: Story = {
  args: {
    defaultOpen: true,
    mode: 'range',
    today: mockToday,
    value: selectedRange,
  },
}

export const RangeError: Story = {
  args: {
    mode: 'range',
    state: 'error',
    value: selectedRange,
  },
}

export const RangeDisabled: Story = {
  args: {
    mode: 'range',
    state: 'disabled',
    value: selectedRange,
  },
}

export const DayHover: Story = {
  args: {
    defaultOpen: true,
    today: mockToday,
    value: new Date(2023, 10, 11),
    dayOverrides: [{ date: new Date(2023, 10, 13), state: 'hover' }],
  },
}

export const DayActive: Story = {
  args: {
    defaultOpen: true,
    today: mockToday,
    value: new Date(2023, 10, 11),
    dayOverrides: [{ date: new Date(2023, 10, 13), state: 'active' }],
  },
}

export const DayFocus: Story = {
  args: {
    defaultOpen: true,
    today: mockToday,
    value: new Date(2023, 10, 11),
    dayOverrides: [{ date: new Date(2023, 10, 13), state: 'focus' }],
  },
}

export const RangeDayFocus: Story = {
  args: {
    defaultOpen: true,
    mode: 'range',
    today: mockToday,
    value: selectedRange,
    dayOverrides: [{ date: new Date(2023, 10, 5), state: 'focus', range: 'middle' }],
  },
}

export const TodayStates: Story = {
  args: {
    defaultOpen: true,
    today: mockToday,
    value: mockToday,
    dayOverrides: [
      { date: mockToday, state: 'default' },
      { date: new Date(2023, 10, 12), state: 'hover' },
      { date: new Date(2023, 10, 13), state: 'active' },
      { date: new Date(2023, 10, 14), state: 'focus' },
    ],
  },
}
