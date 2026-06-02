import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import { Recaptcha } from './Recaptcha'

const themeDecorator = (theme: 'dark' | 'light') => {
  const background = theme === 'dark' ? 'var(--color-dark-900)' : 'var(--color-light-100)'

  function ThemeDecorator(Story: () => ReactNode) {
    return (
      <div data-theme={theme} style={{ padding: 24, background }}>
        <Story />
      </div>
    )
  }

  return ThemeDecorator
}

const meta = {
  title: 'Shared/Recaptcha',
  component: Recaptcha,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

export const LightTheme: Story = {
  decorators: [themeDecorator('light')],
  args: {
    status: 'default',
  },
}

export const DarkTheme: Story = {
  decorators: [themeDecorator('dark')],
  args: {
    status: 'default',
  },
}
