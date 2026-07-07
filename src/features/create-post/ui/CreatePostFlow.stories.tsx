import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  createPostInitialState,
  type CreatePostImage,
  type CreatePostState,
  type CreatePostUploadStatus,
} from '@/features/create-post'

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

function createExportedImageWithUploadStatus(
  id: string,
  status: CreatePostUploadStatus,
  error?: string,
): CreatePostImage {
  return {
    ...createExportedImage(id),
    upload: {
      fileId: `${id}-file`,
      status,
      error,
    },
  }
}

function createState(overrides: Partial<CreatePostState>): CreatePostState {
  return {
    ...createPostInitialState,
    ...overrides,
  }
}

async function simulatePublishAction(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 1200)
  })
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

export const PublicationUploading: Story = {
  render: () => {
    const mockExportedImage = createExportedImageWithUploadStatus('mock-image', 'uploading')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'publication',
          images: [mockExportedImage],
          activeImageId: mockExportedImage.id,
        })}
        onPublishAction={simulatePublishAction}
      />
    )
  },
}

export const PublicationPublishing: Story = {
  render: () => {
    const mockExportedImage = createExportedImageWithUploadStatus('mock-image', 'uploading')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'publication',
          images: [mockExportedImage],
          activeImageId: mockExportedImage.id,
          isPublishing: true,
        })}
        onPublishAction={simulatePublishAction}
      />
    )
  },
}

export const PublicationUploadFailed: Story = {
  render: () => {
    const mockExportedImage = createExportedImageWithUploadStatus(
      'mock-image',
      'failed',
      'Storage upload failed. Please try again.',
    )

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'publication',
          images: [mockExportedImage],
          activeImageId: mockExportedImage.id,
        })}
        onPublishAction={simulatePublishAction}
      />
    )
  },
}

export const PublicationUploadReady: Story = {
  render: () => {
    const mockExportedImage = createExportedImageWithUploadStatus('mock-image', 'ready')

    return (
      <CreatePostFlow
        initialState={createState({
          step: 'publication',
          images: [mockExportedImage],
          activeImageId: mockExportedImage.id,
        })}
        onPublishAction={simulatePublishAction}
      />
    )
  },
}

export const CloseConfirm: Story = {
  render: () => (
    <CreatePostCloseConfirm
      onDiscardAction={() => undefined}
      onKeepEditingAction={() => undefined}
      open
    />
  ),
}
