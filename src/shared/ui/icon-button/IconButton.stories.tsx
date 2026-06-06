import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ExitIcon } from '@radix-ui/react-icons'
import { expect, userEvent, within } from 'storybook/test'

import { BellIcon } from '@/shared/assets'

import { IconButton } from '@/shared/ui'
import styles from './icon-button.stories.module.css'

const meta = {
  title: 'Shared/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton>

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: {
    icon: BellIcon,
    label: 'Notifications',
  },
}

export const Interactive: Story = {
  args: {
    icon: ExitIcon,
    label: 'Sign out',
    onClick: () => undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Sign out' })

    await userEvent.hover(button)
    await expect(button).toBeEnabled()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    icon: ExitIcon,
    label: 'Sign out',
  },
}

export const WithIndicator: Story = {
  args: {
    icon: BellIcon,
    indicatorCount: 5,
    label: '5 unread notifications',
  },
}

export const CustomClassName: Story = {
  args: {
    className: styles.accentButton,
    icon: ExitIcon,
    label: 'Custom sign out',
  },
}
