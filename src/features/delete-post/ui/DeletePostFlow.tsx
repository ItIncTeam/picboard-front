'use client'

import { useState, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import { Button } from '@/shared/ui/button'

import { synchronizeDeletedPost } from '../model/synchronizeDeletedPost'
import { DeletePostConfirm, type DeletePostAction } from './DeletePostConfirm'

export type DeletePostTriggerProps = {
  openDeleteConfirmAction: () => void
}

export type DeletePostFlowProps = {
  postId: string
  children?: (props: DeletePostTriggerProps) => ReactNode
  deletePostAction?: DeletePostAction
  onDeletedAction?: () => void | Promise<void>
  synchronizePostDeletionAction?: (postId: string) => Promise<void>
}

export function DeletePostFlow({
  children,
  deletePostAction,
  onDeletedAction,
  postId,
  synchronizePostDeletionAction = synchronizeDeletedPost,
}: DeletePostFlowProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const openDeleteConfirm = () => {
    setIsConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setIsConfirmOpen(false)
  }

  const handleDeleted = async () => {
    setIsConfirmOpen(false)

    await Promise.allSettled([
      Promise.resolve().then(() => synchronizePostDeletionAction(postId)),
      Promise.resolve().then(() => onDeletedAction?.()),
    ])

    router.replace('/main')
  }

  return (
    <>
      {children ? (
        children({ openDeleteConfirmAction: openDeleteConfirm })
      ) : (
        <Button onClick={openDeleteConfirm} type="button" variant="textButton">
          Delete Post
        </Button>
      )}

      <DeletePostConfirm
        deletePostAction={deletePostAction}
        onCloseAction={closeDeleteConfirm}
        onDeletedAction={handleDeleted}
        open={isConfirmOpen}
        postId={postId}
      />
    </>
  )
}
