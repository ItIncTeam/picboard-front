import type { CreatePostImage, CreatePostState, CreatePostUploadCandidate } from './createPostTypes'

const CREATE_POST_CAPTION_MAX_LENGTH = 500

export function selectHasCreatePostUnsavedData(state: CreatePostState): boolean {
  return state.hasUnsavedData || state.images.length > 0 || state.caption.trim().length > 0
}

export function selectImagesCount(state: CreatePostState): number {
  return state.images.length
}

export function selectHasImages(state: CreatePostState): boolean {
  return selectImagesCount(state) > 0
}

export function selectActiveImage(state: CreatePostState): CreatePostImage | null {
  if (state.activeImageId === null) {
    return null
  }

  return state.images.find((image) => image.id === state.activeImageId) ?? null
}

export function selectHasAllImagesExported(state: CreatePostState): boolean {
  return selectHasImages(state) && state.images.every((image) => image.exported !== undefined)
}

export function selectHasPendingFilterExport(state: CreatePostState): boolean {
  return state.pendingFilterExportImageIds.length > 0
}

export const selectIsReadyForUpload = selectHasAllImagesExported

export function selectUploadCandidates(state: CreatePostState): CreatePostUploadCandidate[] {
  return state.images.reduce<CreatePostUploadCandidate[]>((candidates, image) => {
    if (!image.exported) {
      return candidates
    }

    candidates.push({
      exportedFile: image.exported.file,
      exportedFileInfo: image.exported.fileInfo,
      imageId: image.id,
    })

    return candidates
  }, [])
}

export function selectReadyFileIds(state: CreatePostState): string[] {
  return state.images.reduce<string[]>((fileIds, image) => {
    if (image.upload?.status === 'ready' && image.upload.fileId) {
      fileIds.push(image.upload.fileId)
    }

    return fileIds
  }, [])
}

export function selectAreAllUploadsReady(state: CreatePostState): boolean {
  return (
    selectHasImages(state) &&
    state.images.every((image) => image.upload?.status === 'ready' && Boolean(image.upload.fileId))
  )
}

export function selectCanGoNext(state: CreatePostState): boolean {
  if (state.step === 'publication') {
    return false
  }

  if (state.step === 'filters' && selectHasPendingFilterExport(state)) {
    return false
  }

  if (state.step === 'filters') {
    return selectHasAllImagesExported(state)
  }

  return selectHasImages(state)
}

export function selectCanPublish(state: CreatePostState): boolean {
  return (
    state.step === 'publication' &&
    !selectHasPendingFilterExport(state) &&
    selectHasAllImagesExported(state) &&
    state.caption.length <= CREATE_POST_CAPTION_MAX_LENGTH &&
    !state.isPublishing
  )
}
