'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { mapPostEntityToPost, PostDetails, type PostEntity, type PostImage } from '@/entities/post'
import { useSession } from '@/features/auth/session-management'
import { DeletePostFlow } from '@/features/delete-post'
import { EditPostForm, EditPostMenu } from '@/features/edit-post'
import { Close } from '@/shared/assets'
import { getSafeReturnToPath } from '@/shared/lib/auth'
import { IconButton } from '@/shared/ui/icon-button'
import { Modal } from '@/shared/ui/modal'
import { formatRelativePostTime, PublicPostCarousel } from '@/widgets/public-post-card'

import type { InitialPostData } from './api/loadInitialPost'
import styles from './post-details-page.module.css'

type PostDetailsContentProps = {
  data: InitialPostData
}

function EditPostMediaPreview({ image }: { image: PostImage | undefined }) {
  if (!image) {
    return null
  }

  return (
    <div className={styles.editPreview}>
      <Image
        alt={image.alt || 'Post image'}
        className={styles.editPreviewImage}
        fill
        sizes="(max-width: 720px) calc(100vw - 2rem), 30.375rem"
        src={image.url}
        unoptimized
      />
    </div>
  )
}

export function PostDetailsContent({ data }: PostDetailsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status: sessionStatus, user: sessionUser } = useSession()
  const [entity, setEntity] = useState<PostEntity>(data.post)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const safeReturnTo = getSafeReturnToPath(searchParams.get('returnTo'))

  const closePage = () => {
    router.replace(safeReturnTo)
  }

  const displayPost = mapPostEntityToPost(entity)
  const isOwner = sessionStatus === 'authenticated' && sessionUser?.id === entity.ownerId
  const previewImage =
    displayPost.images[Math.min(activeImageIndex, Math.max(displayPost.images.length - 1, 0))]

  return isOwner && isEditOpen ? (
    <EditPostForm
      author={displayPost.author}
      description={entity.description ?? ''}
      media={<EditPostMediaPreview image={previewImage} />}
      onCloseAction={() => setIsEditOpen(false)}
      onSavedAction={(nextEntity) => {
        setEntity(nextEntity)
        setIsEditOpen(false)
      }}
      postId={entity.id}
    />
  ) : (
    <Modal
      bodyClassName={styles.body}
      className={styles.modal}
      hideCloseButton
      hideHeader
      modalTitle="Post details"
      onCloseAction={closePage}
      open
    >
      <PostDetails
        author={displayPost.author}
        caption={displayPost.caption}
        createdAt={entity.createdAt}
        createdAtLabel={formatRelativePostTime(entity.createdAt)}
        headerAction={
          <>
            {isOwner ? (
              <DeletePostFlow postId={entity.id} returnTo={safeReturnTo}>
                {({ openDeleteConfirmAction }) => (
                  <EditPostMenu
                    onDeleteAction={openDeleteConfirmAction}
                    onEditAction={() => setIsEditOpen(true)}
                  />
                )}
              </DeletePostFlow>
            ) : null}
            <IconButton icon={Close} label="Close" onClick={closePage} />
          </>
        }
        media={
          <PublicPostCarousel
            activeIndex={activeImageIndex}
            fit="contain"
            media={displayPost.images}
            onActiveIndexChange={setActiveImageIndex}
          />
        }
      />
    </Modal>
  )
}
