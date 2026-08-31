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
  { alt: '16:9 landscape fixture', id: 'story-image-1', url: '/storybook/post-16-9.svg' },
  { alt: '4:5 portrait fixture', id: 'story-image-2', url: '/storybook/post-4-5.svg' },
  { alt: '1:1 square fixture', id: 'story-image-3', url: '/storybook/post-1.svg' },
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
    author: {
      displayName: 'Story Author',
      id: 'owner-1',
      profilePictureFileId: null,
      username: 'story_author',
    },
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

  const renderCarousel = () => <PublicPostCarousel fit="contain" media={storyImages} />

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
          author={entity.author}
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
          author={entity.author}
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
