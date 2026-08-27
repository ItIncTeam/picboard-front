'use client'

import { useState } from 'react'

import { deletePost } from '@/entities/post/api/postsApi'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './delete-post-confirm.module.css'

export type DeletePostAction = (input: { postId: string }) => Promise<boolean>

export type DeletePostConfirmProps = {
  open: boolean
  postId: string
  deletePostAction?: DeletePostAction
  onCloseAction: () => void
  onDeletedAction: () => void | Promise<void>
}

const defaultErrorMessage = 'Post deletion failed. Please try again.'

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : defaultErrorMessage
}

export function DeletePostConfirm({
  deletePostAction = deletePost,
  onCloseAction,
  onDeletedAction,
  open,
  postId,
}: DeletePostConfirmProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    if (isDeleting) {
      return
    }

    setErrorMessage(null)
    onCloseAction()
  }

  const handleConfirmDelete = async () => {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const isDeleted = await deletePostAction({ postId })

      if (!isDeleted) {
        throw new Error(defaultErrorMessage)
      }

      await onDeletedAction()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      className={styles.modal}
      hideCloseButton={isDeleting}
      modalTitle="Delete Post"
      onCloseAction={handleClose}
      open={open}
    >
      <div className={styles.content}>
        <Text>Are you sure you want to delete this post?</Text>

        {errorMessage ? (
          <Text className={styles.error} role="alert">
            {errorMessage}
          </Text>
        ) : null}

        <div className={styles.actions}>
          <Button disabled={isDeleting} onClick={handleClose} type="button" variant="textButton">
            No
          </Button>

          <Button
            disabled={isDeleting}
            loading={isDeleting}
            loadingText="Deleting"
            onClick={handleConfirmDelete}
            type="button"
          >
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
