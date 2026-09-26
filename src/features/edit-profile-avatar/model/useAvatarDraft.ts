'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getAvatarFileValidationError,
  type AvatarDraft,
  type AvatarFileValidationError,
} from './avatarDraft'

type AvatarDraftState = {
  draft: AvatarDraft | null
  error: AvatarFileValidationError | null
}

export function useAvatarDraft(): AvatarDraftState & {
  cancelDraft: () => void
  selectFile: (file: File) => void
} {
  const [draft, setDraft] = useState<AvatarDraft | null>(null)
  const [error, setError] = useState<AvatarFileValidationError | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const revokePreviewUrl = useCallback((previewUrl: string | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [])

  const cancelDraft = useCallback(() => {
    revokePreviewUrl(previewUrlRef.current)
    previewUrlRef.current = null
    setDraft(null)
    setError(null)
  }, [revokePreviewUrl])

  const selectFile = useCallback(
    (file: File) => {
      const validationError = getAvatarFileValidationError(file)

      if (validationError) {
        setError(validationError)

        return
      }

      const nextPreviewUrl = URL.createObjectURL(file)
      const previousPreviewUrl = previewUrlRef.current

      previewUrlRef.current = nextPreviewUrl
      setDraft({ file, previewUrl: nextPreviewUrl })
      setError(null)
      revokePreviewUrl(previousPreviewUrl)
    },
    [revokePreviewUrl],
  )

  useEffect(() => {
    return () => revokePreviewUrl(previewUrlRef.current)
  }, [revokePreviewUrl])

  return { cancelDraft, draft, error, selectFile }
}
