'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  type AvatarCandidate,
  type AvatarCropSelection,
  getAvatarFileValidationError,
  type AvatarDraft,
  type AvatarFileValidationError,
} from './avatarDraft'

type AvatarDraftState = {
  candidate: AvatarCandidate | null
  draft: AvatarDraft | null
  error: AvatarFileValidationError | null
}

export function useAvatarDraft(): AvatarDraftState & {
  cancelCandidate: (candidateId: number) => void
  cancelDraft: () => void
  confirmCandidate: (candidateId: number, cropSelection: AvatarCropSelection) => void
  rejectCandidate: (candidateId: number) => void
  selectFile: (file: File) => void
} {
  const [candidate, setCandidate] = useState<AvatarCandidate | null>(null)
  const [draft, setDraft] = useState<AvatarDraft | null>(null)
  const [error, setError] = useState<AvatarFileValidationError | null>(null)
  const candidateRef = useRef<AvatarCandidate | null>(null)
  const candidateIdRef = useRef(0)
  const draftRef = useRef<AvatarDraft | null>(null)

  const revokePreviewUrl = useCallback((previewUrl: string | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [])

  const cancelDraft = useCallback(() => {
    revokePreviewUrl(draftRef.current?.previewUrl ?? null)
    draftRef.current = null
    setDraft(null)
    setError(null)
  }, [revokePreviewUrl])

  const cancelCandidate = useCallback(
    (candidateId: number) => {
      const activeCandidate = candidateRef.current

      if (!activeCandidate || activeCandidate.id !== candidateId) {
        return
      }

      revokePreviewUrl(activeCandidate.previewUrl)
      candidateRef.current = null
      setCandidate(null)
      setError(null)
    },
    [revokePreviewUrl],
  )

  const rejectCandidate = useCallback(
    (candidateId: number) => {
      const activeCandidate = candidateRef.current

      if (!activeCandidate || activeCandidate.id !== candidateId) {
        return
      }

      revokePreviewUrl(activeCandidate.previewUrl)
      candidateRef.current = null
      setCandidate(null)
      setError('decode')
    },
    [revokePreviewUrl],
  )

  const confirmCandidate = useCallback(
    (candidateId: number, cropSelection: AvatarCropSelection) => {
      const activeCandidate = candidateRef.current

      if (!activeCandidate || activeCandidate.id !== candidateId) {
        return
      }

      const nextDraft: AvatarDraft = {
        cropSelection,
        file: activeCandidate.file,
        previewUrl: activeCandidate.previewUrl,
      }
      const previousPreviewUrl = draftRef.current?.previewUrl ?? null

      draftRef.current = nextDraft
      candidateRef.current = null
      setDraft(nextDraft)
      setCandidate(null)
      setError(null)
      revokePreviewUrl(previousPreviewUrl)
    },
    [revokePreviewUrl],
  )

  const selectFile = useCallback(
    (file: File) => {
      const validationError = getAvatarFileValidationError(file)

      if (validationError) {
        setError(validationError)

        return
      }

      const previousCandidate = candidateRef.current
      const nextCandidate: AvatarCandidate = {
        file,
        id: candidateIdRef.current + 1,
        previewUrl: URL.createObjectURL(file),
      }

      candidateIdRef.current = nextCandidate.id
      candidateRef.current = nextCandidate
      setCandidate(nextCandidate)
      setError(null)
      revokePreviewUrl(previousCandidate?.previewUrl ?? null)
    },
    [revokePreviewUrl],
  )

  useEffect(() => {
    return () => {
      revokePreviewUrl(candidateRef.current?.previewUrl ?? null)
      revokePreviewUrl(draftRef.current?.previewUrl ?? null)
    }
  }, [revokePreviewUrl])

  return {
    cancelCandidate,
    cancelDraft,
    candidate,
    confirmCandidate,
    draft,
    error,
    rejectCandidate,
    selectFile,
  }
}
