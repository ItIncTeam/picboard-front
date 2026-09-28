export const ACCEPTED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png'] as const
export const MAX_AVATAR_FILE_SIZE_BYTES = 10 * 1024 * 1024

export type AvatarDraft = {
  cropSelection: AvatarCropSelection
  file: File
  previewUrl: string
}

export type AvatarCandidate = {
  file: File
  id: number
  previewUrl: string
}

export type AvatarCropSelection = {
  height: number
  left: number
  source: File
  top: number
  width: number
}

export type AvatarCropCoordinates = Omit<AvatarCropSelection, 'source'>

export type AvatarFileValidationError = 'decode' | 'fileSize' | 'fileType'

export function getAvatarFileValidationError(file: File): AvatarFileValidationError | null {
  if (
    !ACCEPTED_AVATAR_MIME_TYPES.includes(file.type as (typeof ACCEPTED_AVATAR_MIME_TYPES)[number])
  ) {
    return 'fileType'
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    return 'fileSize'
  }

  return null
}

export function createAvatarCropSelection(
  source: File,
  coordinates: AvatarCropCoordinates,
): AvatarCropSelection {
  return {
    height: coordinates.width,
    left: coordinates.left,
    source,
    top: coordinates.top,
    width: coordinates.width,
  }
}
