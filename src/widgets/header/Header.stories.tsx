import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import { SessionContext } from '@/features/auth/session-management/model/SessionProvider'
import type { SessionContextValue } from '@/features/auth/session-management/model/types'

import { Header } from './Header'

const sessionContextValue: SessionContextValue = {
  status: 'authenticated',
  user: null,
  authenticateWithCurrentToken: async () => {},
  isAuthenticated: true,
  isBootstrapping: false,
  logout: async () => {},
  refreshSession: async () => {},
  setAnonymousSession: () => {},
}

function SessionDecorator(Story: () => ReactNode) {
  return (
    <SessionContext.Provider value={sessionContextValue}>
      <Story />
    </SessionContext.Provider>
  )
}

const meta = {
  title: 'Widgets/Header',
  component: Header,
  decorators: [SessionDecorator],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
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
