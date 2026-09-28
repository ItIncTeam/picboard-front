'use client'

import { type ChangeEvent, useRef } from 'react'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'

import { ACCEPTED_AVATAR_MIME_TYPES } from '../model/avatarDraft'
import { useAvatarDraft } from '../model/useAvatarDraft'
import { AvatarCropper } from './AvatarCropper'
import styles from './avatar-draft-picker.module.css'

export function AvatarDraftPicker() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    const [file] = Array.from(event.currentTarget.files ?? [])

    if (file) {
      selectFile(file)
    }

    event.currentTarget.value = ''
  }

  const errorMessage = error ? t.profile.avatar[error] : null
  let avatarContent = <div aria-hidden className={styles.previewPlaceholder} />

  if (candidate) {
    avatarContent = (
      <AvatarCropper
        candidate={candidate}
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
  }

  return (
    <section aria-label={t.profile.avatar.title} className={styles.root}>
      <input
        ref={fileInputRef}
        accept={ACCEPTED_AVATAR_MIME_TYPES.join(',')}
        aria-label={t.profile.avatar.selectPhoto}
        className={styles.fileInput}
        onChange={handleFileChange}
        tabIndex={-1}
        type="file"
      />

      {avatarContent}

      {!candidate ? (
        <div className={styles.actions}>
          <Button onClick={() => fileInputRef.current?.click()} type="button" variant="outlined">
            {draft ? t.profile.avatar.replacePhoto : t.profile.avatar.selectPhoto}
          </Button>
          {draft ? (
            <Button onClick={cancelDraft} type="button" variant="textButton">
              {t.profile.avatar.cancel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </section>
  )
}
