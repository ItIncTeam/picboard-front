'use client'

import { useCallback, useRef, useState } from 'react'

import type { CropperRef } from 'react-advanced-cropper'
import { Cropper } from 'react-advanced-cropper'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'

import {
  createAvatarCropSelection,
  type AvatarCandidate,
  type AvatarCropSelection,
} from '../model/avatarDraft'
import styles from './avatar-draft-picker.module.css'

type AvatarCropperProps = {
  candidate: AvatarCandidate
  disabled?: boolean
  onCancel: (candidateId: number) => void
  onError: (candidateId: number) => void
  onSave: (candidateId: number, selection: AvatarCropSelection) => void
}

function getSelection(cropper: CropperRef, source: File): AvatarCropSelection | null {
  const coordinates = cropper.getState()?.coordinates

  if (!coordinates) {
    return null
  }

  return createAvatarCropSelection(source, coordinates)
}

export function AvatarCropper({
  candidate,
  disabled = false,
  onCancel,
  onError,
  onSave,
}: AvatarCropperProps) {
  const { t } = useI18n()
  const [selection, setSelection] = useState<AvatarCropSelection | null>(null)
  const readyCandidateIdRef = useRef<number | null>(null)

  const updateSelection = useCallback(
    (cropper: CropperRef) => {
      if (readyCandidateIdRef.current !== candidate.id) {
        return
      }

      setSelection(getSelection(cropper, candidate.file))
    },
    [candidate.file, candidate.id],
  )

  const handleReady = useCallback(
    (cropper: CropperRef) => {
      readyCandidateIdRef.current = candidate.id
      setSelection(getSelection(cropper, candidate.file))
    },
    [candidate.file, candidate.id],
  )

  const handleError = useCallback(() => {
    if (readyCandidateIdRef.current === candidate.id) {
      return
    }

    onError(candidate.id)
  }, [candidate.id, onError])

  return (
    <section aria-label={t.profile.avatar.cropTitle} className={styles.cropRoot}>
      <div className={styles.cropViewport}>
        <Cropper
          key={candidate.id}
          className={styles.cropper}
          disabled={disabled}
          onChange={updateSelection}
          onError={handleError}
          onReady={handleReady}
          src={candidate.previewUrl}
          stencilProps={{ aspectRatio: 1 }}
        />
      </div>

      <div className={styles.actions}>
        <Button
          disabled={!selection || disabled}
          onClick={() => selection && onSave(candidate.id, selection)}
          type="button"
        >
          {t.profile.avatar.saveCrop}
        </Button>
        <Button
          disabled={disabled}
          onClick={() => onCancel(candidate.id)}
          type="button"
          variant="textButton"
        >
          {t.profile.avatar.cancel}
        </Button>
      </div>
    </section>
  )
}
