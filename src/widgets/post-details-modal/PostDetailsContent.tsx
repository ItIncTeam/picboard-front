'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { mapPostEntityToPost, PostDetails, type PostEntity, type PostImage } from '@/entities/post'
import { useSession } from '@/features/auth/session-management'
import { DeletePostFlow } from '@/features/delete-post'
import { EditPostForm, EditPostMenu } from '@/features/edit-post'
import { Close } from '@/shared/assets'
import { getSafeReturnToPath } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { IconButton } from '@/shared/ui/icon-button'
import { Modal } from '@/shared/ui/modal'
import { formatRelativePostTime, PublicPostCarousel } from '@/widgets/public-post-card'

import type { PostDetailsData } from './model/types'
import styles from './post-details-content.module.css'
import modalStyles from './post-details-modal.module.css'

type PostDetailsContentProps = {
  chrome?: 'page' | 'modal'
  data: PostDetailsData
  onCloseAction?: () => void
}

type PostDetailsPageShellProps = {
  children: ReactNode
  onCloseAction: () => void
}

export function PostDetailsPageShell({ children, onCloseAction }: PostDetailsPageShellProps) {
  return (
    <section className={styles.page}>
      <button
        aria-hidden
        className={styles.overlay}
        onClick={onCloseAction}
        tabIndex={-1}
        type="button"
      />
      <div className={styles.frame}>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  )
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

export function PostDetailsContent({
  chrome = 'page',
  data,
  onCloseAction,
}: PostDetailsContentProps) {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status: sessionStatus, user: sessionUser } = useSession()
  const [entity, setEntity] = useState<PostEntity>(data.post)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const safeReturnTo = getSafeReturnToPath(searchParams.get('returnTo'))

  const closePage = () => {
    if (onCloseAction) {
      onCloseAction()
      return
    }

    router.replace(safeReturnTo)
  }

  const displayPost = mapPostEntityToPost(entity)
  const isOwner = sessionStatus === 'authenticated' && sessionUser?.id === entity.ownerId
  const previewImage =
    displayPost.images[Math.min(activeImageIndex, Math.max(displayPost.images.length - 1, 0))]

  if (isOwner && isEditOpen) {
    return (
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
    )
  }

  const details = (
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
  )

  if (chrome === 'modal') {
    return (
      <Modal
        bodyClassName={modalStyles.body}
        className={modalStyles.modal}
        hideCloseButton
        hideHeader
        modalTitle={t.widgets.postDetailsModal.title}
        onCloseAction={closePage}
        open
      >
        {details}
      </Modal>
    )
  }

  return <PostDetailsPageShell onCloseAction={closePage}>{details}</PostDetailsPageShell>
}
