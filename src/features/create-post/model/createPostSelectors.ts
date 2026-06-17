import type { CreatePostImage, CreatePostState } from './createPostTypes'

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

export function selectIsReadyForUpload(state: CreatePostState): boolean {
  return selectHasImages(state) && state.images.every((image) => image.exported !== undefined)
}

export function selectCanGoNext(state: CreatePostState): boolean {
  if (state.step === 'publication') {
    return false
  }

  return selectHasImages(state)
}

export function selectCanPublish(state: CreatePostState): boolean {
  return state.step === 'publication' && selectIsReadyForUpload(state)
}
