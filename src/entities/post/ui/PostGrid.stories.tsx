import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { createMockPosts } from '../lib/postMocks'
import { PostGrid } from './PostGrid'

const meta = {
  title: 'Entities/Post/PostGrid',
  component: PostGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PostGrid>

export default meta
type Story = StoryObj<typeof PostGrid>

export const ProfileGrid: Story = {
  args: {
    posts: createMockPosts(8),
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    skeletonCount: 8,
  },
}

export const Empty: Story = {
  args: {
    posts: [],
  },
}
