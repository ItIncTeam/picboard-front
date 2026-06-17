import type { CreatePostState } from './createPostTypes'

export function selectHasCreatePostUnsavedData(state: CreatePostState): boolean {
  return state.hasUnsavedData || state.images.length > 0 || state.caption.trim().length > 0
}

export function selectIsReadyForUpload(state: CreatePostState): boolean {
  return state.images.length > 0 && state.images.every((image) => image.exported !== undefined)
}

export function selectCanGoNext(state: CreatePostState): boolean {
  if (state.step === 'publication') {
    return false
  }

  return state.images.length > 0
}

export function selectCanPublish(state: CreatePostState): boolean {
  return state.step === 'publication' && selectIsReadyForUpload(state)
}
