import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PostDetails, type PostEntity, type PostImage } from '@/entities/post'
import { EditPostForm, EditPostMenu } from '@/features/edit-post'
import { Close } from '@/shared/assets'
import { IconButton } from '@/shared/ui/icon-button'
import { Modal } from '@/shared/ui/modal'
import { formatRelativePostTime, PublicPostCarousel } from '@/widgets/public-post-card'

import styles from './post-details-page.module.css'

const meta = {
  title: 'Views/PostDetailsPage',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const storyImages: PostImage[] = [
  { alt: 'Story post image 1', id: 'story-image-1', url: '/storybook/post-1.svg' },
  { alt: 'Story post image 2', id: 'story-image-2', url: '/storybook/post-2.svg' },
  { alt: 'Story post image 3', id: 'story-image-3', url: '/storybook/post-3.svg' },
]

const createdAt = '2026-08-28T12:00:00.000Z'

function createMockPostEntity(description: string): PostEntity {
  return {
    attachments: storyImages.map((image, index) => ({
      file: {
        id: image.id,
        mimeType: 'JPEG',
        originalName: `${image.id}.jpg`,
        ownerId: 'owner-1',
        purpose: 'POST_IMAGE',
        size: 120_000,
        status: 'READY',
        url: image.url,
      },
      fileId: image.id,
      sortOrder: index,
    })),
    createdAt,
    description,
    id: 'story-post',
    ownerId: 'owner-1',
    updatedAt: createdAt,
  }
}

function PostDetailsPreview({ startInEdit = false }: { startInEdit?: boolean }) {
  const [entity, setEntity] = useState(() => createMockPostEntity('Publication description'))
  const [isEditOpen, setIsEditOpen] = useState(startInEdit)

  const renderCarousel = () => <PublicPostCarousel media={storyImages} />

  return (
    <>
      <Modal
        bodyClassName={styles.body}
        className={styles.modal}
        hideCloseButton
        hideHeader
        modalTitle="Post details"
        onCloseAction={() => undefined}
        open
      >
        <PostDetails
          authorName="User"
          caption={entity.description ?? undefined}
          createdAt={entity.createdAt}
          createdAtLabel={formatRelativePostTime(entity.createdAt)}
          headerAction={
            <>
              <EditPostMenu onEditAction={() => setIsEditOpen(true)} />
              <IconButton icon={Close} label="Close" onClick={() => undefined} />
            </>
          }
          media={renderCarousel()}
        />
      </Modal>

      {isEditOpen ? (
        <EditPostForm
          description={entity.description ?? ''}
          media={renderCarousel()}
          onCloseAction={() => setIsEditOpen(false)}
          onSavedAction={(nextEntity) => {
            setEntity(nextEntity)
            setIsEditOpen(false)
          }}
          postId={entity.id}
        />
      ) : null}
    </>
  )
}

export const OwnerView: Story = {
  render: () => <PostDetailsPreview />,
}

export const EditPost: Story = {
  render: () => <PostDetailsPreview startInEdit />,
}
