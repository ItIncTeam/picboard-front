import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import {
  createPostInitialState,
  type CreatePostImage,
  type CreatePostState,
} from '@/features/create-post'
import { Button } from '@/shared/ui/button'

import { CreatePostCloseConfirm } from './CreatePostCloseConfirm'
import { CreatePostFlow } from './CreatePostFlow'

const meta = {
  title: 'Features/CreatePost/CreatePostFlow',
  component: CreatePostFlow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CreatePostFlow>

export default meta
type Story = StoryObj<typeof CreatePostFlow>

const mockFileInfo = {
  name: 'mock-image.jpg',
  size: 120_000,
  type: 'image/jpeg',
  lastModified: 1_700_000_000_000,
}

function createImage(id: string): CreatePostImage {
  return {
    id,
    name: `${id}.jpg`,
    fileInfo: mockFileInfo,
    previewUrl: `about:blank#${id}`,
    aspectRatio: 'original',
    filter: 'normal',
  }
}

function createExportedImage(id: string): CreatePostImage {
  return {
    ...createImage(id),
    exported: {
      file: new File(['mock image'], `${id}-exported.jpg`, { type: 'image/jpeg' }),
      objectUrl: `about:blank#${id}-exported`,
      fileInfo: {
        ...mockFileInfo,
        name: `${id}-exported.jpg`,
      },
    },
  }
}

function createState(overrides: Partial<CreatePostState>): CreatePostState {
  return {
    ...createPostInitialState,
    ...overrides,
  }
}

export const Upload: Story = {
  render: () => (
    <CreatePostFlow
      initialState={createState({
        step: 'upload',
      })}
      onCloseAction={() => undefined}
    />
  ),
}

export const CropWithMockImage: Story = {
  render: () => {
    const mockImage = createImage('mock-image')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'crop',
          images: [mockImage],
          activeImageId: mockImage.id,
        })}
      />
    )
  },
}

export const FiltersWithMockImage: Story = {
  render: () => {
    const mockImage = createImage('mock-image')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'filters',
          images: [mockImage],
          activeImageId: mockImage.id,
        })}
      />
    )
  },
}

export const PublicationWithExportedMockImage: Story = {
  render: () => {
    const mockExportedImage = createExportedImage('mock-image')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'publication',
          images: [mockExportedImage],
          activeImageId: mockExportedImage.id,
        })}
      />
    )
  },
}

export const CloseConfirm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    const openConfirm = () => {
      setIsOpen(true)
    }

    const closeConfirm = () => {
      setIsOpen(false)
    }

    return (
      <>
        <Button type="button" onClick={openConfirm}>
          Open confirm
        </Button>
        <CreatePostCloseConfirm
          onDiscardAction={closeConfirm}
          onKeepEditingAction={closeConfirm}
          open={isOpen}
        />
      </>
    )
  },
}
