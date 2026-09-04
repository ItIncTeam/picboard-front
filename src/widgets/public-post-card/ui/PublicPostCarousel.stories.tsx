import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { PostImage } from '@/entities/post'
import { PublicPostCarousel } from './PublicPostCarousel'

const landscapeMedia: PostImage[] = [
  { alt: '16:9 landscape fixture', id: 'story-16-9', url: '/storybook/post-16-9.svg' },
]

const mixedCropMedia: PostImage[] = [
  { alt: '16:9 landscape fixture', id: 'story-16-9', url: '/storybook/post-16-9.svg' },
  { alt: '4:5 portrait fixture', id: 'story-4-5', url: '/storybook/post-4-5.svg' },
  { alt: '1:1 square fixture', id: 'story-1-1', url: '/storybook/post-1.svg' },
]

const thumbnailDecorator = (Story: () => ReactNode) => (
  <div style={{ width: 234 }}>
    <Story />
  </div>
)

const detailsDecorator = (Story: () => ReactNode) => (
  <div style={{ width: 492, height: 492, background: 'var(--color-surface-secondary)' }}>
    <Story />
  </div>
)

const meta = {
  title: 'Widgets/PublicPostCarousel',
  component: PublicPostCarousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    media: landscapeMedia,
  },
} satisfies Meta<typeof PublicPostCarousel>

export default meta
type Story = StoryObj<typeof PublicPostCarousel>

export const ThumbnailCover: Story = {
  decorators: [thumbnailDecorator],
}

export const DetailsContain: Story = {
  args: {
    fit: 'contain',
  },
  decorators: [detailsDecorator],
}

export const DetailsContainMixedRatios: Story = {
  args: {
    fit: 'contain',
    media: mixedCropMedia,
  },
  decorators: [detailsDecorator],
}
