import type { CreatePostState } from './createPostTypes'

export function selectHasCreatePostUnsavedData(state: CreatePostState): boolean {
  return state.hasUnsavedData || state.images.length > 0 || state.caption.trim().length > 0
}

export function selectIsReadyForUpload(state: CreatePostState): boolean {
  return state.images.length > 0 && state.images.every((image) => image.exported !== undefined)
}
