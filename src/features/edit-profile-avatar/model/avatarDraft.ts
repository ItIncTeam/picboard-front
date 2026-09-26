export const ACCEPTED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png'] as const
export const MAX_AVATAR_FILE_SIZE_BYTES = 10 * 1024 * 1024

export type AvatarDraft = {
  file: File
  previewUrl: string
}

export type AvatarFileValidationError = 'fileSize' | 'fileType'

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
