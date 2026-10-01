'use client'

import { type ChangeEvent, useRef, useState } from 'react'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'

import { ACCEPTED_AVATAR_MIME_TYPES } from '../model/avatarDraft'
import { useAvatarDraft } from '../model/useAvatarDraft'
import { AvatarCropper } from './AvatarCropper'
import { AvatarDeleteConfirm } from './AvatarDeleteConfirm'
import styles from './avatar-draft-picker.module.css'

export type OnDeleteAvatar = () => Promise<void>

type AvatarDraftPickerProps = {
  initialSavedAvatarUrl: string | null
  onDeleteAvatar: OnDeleteAvatar
}

export function AvatarDraftPicker({
  initialSavedAvatarUrl,
  onDeleteAvatar,
}: AvatarDraftPickerProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDeletingRef = useRef(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(initialSavedAvatarUrl)
  const {
    cancelCandidate,
    cancelDraft,
    candidate,
    confirmCandidate,
    draft,
    error,
    rejectCandidate,
    selectFile,
  } = useAvatarDraft()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isDeleting) {
      return
    }

    const [file] = Array.from(event.currentTarget.files ?? [])

    if (file) {
      selectFile(file)
    }

    event.currentTarget.value = ''
  }

  const closeDeleteConfirm = (): void => {
    if (isDeletingRef.current) {
      return
    }

    setDeleteError(null)
    setIsDeleteModalOpen(false)
  }

  const openDeleteConfirm = (): void => {
    if (!savedAvatarUrl || isDeletingRef.current) {
      return
    }

    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async (): Promise<void> => {
    if (isDeletingRef.current || !savedAvatarUrl) {
      return
    }

    isDeletingRef.current = true
    setDeleteError(null)
    setIsDeleting(true)

    try {
      await onDeleteAvatar()
    } catch {
      setDeleteError(t.profile.avatar.deleteFailed)
      isDeletingRef.current = false
      setIsDeleting(false)

      return
    }

    setSavedAvatarUrl(null)
    isDeletingRef.current = false
    setIsDeleting(false)
    setIsDeleteModalOpen(false)
  }

  const errorMessage = error ? t.profile.avatar[error] : null
  let avatarContent = <div aria-hidden className={styles.previewPlaceholder} />

  if (candidate) {
    avatarContent = (
      <AvatarCropper
        candidate={candidate}
        disabled={isDeleting}
        key={candidate.id}
        onCancel={cancelCandidate}
        onError={rejectCandidate}
        onSave={confirmCandidate}
      />
    )
  } else if (draft) {
    avatarContent = (
      // Object URLs are browser-local and cannot use the Next.js image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={t.profile.avatar.previewAlt} className={styles.preview} src={draft.previewUrl} />
    )
  } else if (savedAvatarUrl) {
    avatarContent = (
      // The saved URL belongs to the server-backed Avatar, not to a local object URL.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={t.profile.avatar.previewAlt} className={styles.preview} src={savedAvatarUrl} />
    )
  }

  return (
    <section aria-label={t.profile.avatar.title} className={styles.root}>
      <input
        ref={fileInputRef}
        accept={ACCEPTED_AVATAR_MIME_TYPES.join(',')}
        aria-label={t.profile.avatar.selectPhoto}
        className={styles.fileInput}
        disabled={isDeleting}
        onChange={handleFileChange}
        tabIndex={-1}
        type="file"
      />

      {avatarContent}

      {!candidate ? (
        <div className={styles.actions}>
          <Button
            disabled={isDeleting}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="outlined"
          >
            {draft || savedAvatarUrl ? t.profile.avatar.replacePhoto : t.profile.avatar.selectPhoto}
          </Button>
          {draft ? (
            <Button disabled={isDeleting} onClick={cancelDraft} type="button" variant="textButton">
              {t.profile.avatar.cancel}
            </Button>
          ) : null}
          {savedAvatarUrl ? (
            <Button
              disabled={isDeleting}
              onClick={openDeleteConfirm}
              type="button"
              variant="textButton"
            >
              {t.profile.avatar.deletePhoto}
            </Button>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      <AvatarDeleteConfirm
        errorMessage={deleteError}
        isDeleting={isDeleting}
        onCloseAction={closeDeleteConfirm}
        onConfirmAction={() => void confirmDelete()}
        open={isDeleteModalOpen}
      />
    </section>
  )
}
