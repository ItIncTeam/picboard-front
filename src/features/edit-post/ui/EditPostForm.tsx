'use client'

import { type ReactNode, useState } from 'react'

import { updatePostDescription, type PostEntity } from '@/entities/post'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextArea } from '@/shared/ui/text-area/TextArea'

import { EDIT_POST_DESCRIPTION_MAX_LENGTH } from '../lib/editPostConstants'
import { synchronizeUpdatedPost } from '../model/synchronizeUpdatedPost'
import { EditPostCloseConfirm } from './EditPostCloseConfirm'
import styles from './edit-post-form.module.css'

type EditPostFormProps = {
  description: string
  media: ReactNode
  onCloseAction: () => void
  onSavedAction: (post: PostEntity) => void
  postId: string
  synchronizePostUpdateAction?: (postId: string) => Promise<void>
}

const DESCRIPTION_MAX_LENGTH_ERROR = `Maximum number of characters ${EDIT_POST_DESCRIPTION_MAX_LENGTH}`

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Post description update failed. Please try again.'
}

export function EditPostForm({
  description,
  media,
  onCloseAction,
  onSavedAction,
  postId,
  synchronizePostUpdateAction = synchronizeUpdatedPost,
}: EditPostFormProps) {
  const [draft, setDraft] = useState(description)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isDirty = draft !== description
  const isOverLimit = draft.length > EDIT_POST_DESCRIPTION_MAX_LENGTH

  const requestClose = () => {
    if (isSaving) {
      return
    }

    if (isDirty) {
      setIsConfirmOpen(true)
      return
    }

    onCloseAction()
  }

  const handleSave = async () => {
    if (!isDirty || isOverLimit || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const payload = await updatePostDescription({
        description: draft.trim() === '' ? null : draft,
        postId,
      })

      onSavedAction(payload)

      void synchronizePostUpdateAction(postId).catch((error: unknown) => {
        console.error('[EditPost] unexpected post-update synchronization failure', {
          postId,
          reason: error,
        })
      })
    } catch (error) {
      setSaveError(getErrorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <>
      <Modal
        bodyClassName={styles.body}
        className={styles.modal}
        modalTitle="Edit Post"
        onCloseAction={requestClose}
        open
      >
        <div className={styles.layout}>
          <div className={styles.media}>{media}</div>

          <div className={styles.form}>
            <div className={styles.authorRow}>
              <span aria-hidden className={styles.avatar}>
                U
              </span>
              <span className={styles.authorName}>User</span>
            </div>

            <div className={styles.descriptionField}>
              <TextArea
                className={styles.textArea}
                disabled={isSaving}
                error={isOverLimit ? DESCRIPTION_MAX_LENGTH_ERROR : null}
                label="Add publication descriptions"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Text-area"
                value={draft}
              />
              <span aria-live="polite" className={styles.counter} data-over-limit={isOverLimit}>
                {draft.length}/{EDIT_POST_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <div className={styles.footer}>
              {saveError ? (
                <p className={styles.saveError} role="alert">
                  {saveError}
                </p>
              ) : null}

              <Button
                className={styles.saveButton}
                disabled={!isDirty || isOverLimit}
                loading={isSaving}
                onClick={() => {
                  void handleSave()
                }}
                type="button"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <EditPostCloseConfirm
        onDiscardAction={() => {
          setIsConfirmOpen(false)
          onCloseAction()
        }}
        onKeepEditingAction={() => setIsConfirmOpen(false)}
        open={isConfirmOpen}
      />
    </>
  )
}
