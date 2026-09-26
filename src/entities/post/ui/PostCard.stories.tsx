import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { mockLongCaptionPost, mockMultiImagePost, mockSinglePost } from '../lib/postMocks'
import { PostCard } from './PostCard'

const meta = {
  title: 'Entities/Post/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof PostCard>

export const SingleImage: Story = {
  args: {
    post: mockSinglePost,
  },
}

export const MultipleImages: Story = {
  args: {
    post: mockMultiImagePost,
  },
}

export const LongCaption: Story = {
  args: {
    post: mockLongCaptionPost,
    showCaption: true,
  },
}
