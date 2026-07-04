// Frontend-only in-memory UI flow state. This is not product draft persistence
// and not a backend contract.
export type CreatePostStep = 'upload' | 'crop' | 'filters' | 'publication'

export type AspectRatio = 'original' | '1:1' | '4:5' | '16:9'

export type ImageFilter = 'normal' | 'clarendon' | 'lark' | 'gingham' | 'moon'

export type CreatePostImageFileInfo = {
  name: string
  size: number
  type: string
  lastModified: number
}

export type CreatePostUploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed' | 'ready'

/**
 * Upload patch from backend upload pipeline.
 *
 * imageId is the local image id and must match clientUploadId
 * used in initiateUploadBatch.
 * Never update upload state by array index.
 */
export type CreatePostUploadPatch = {
  imageId: string
  fileId?: string
  uploadUrl?: string
  expiresAt?: string
  status?: CreatePostUploadStatus
  error?: string
}

export type CreatePostUploadCandidate = {
  imageId: string
  file: File
  fileInfo: CreatePostImageFileInfo
}

export type CreatePostImage = {
  /**
   * Local image identity used as backend clientUploadId.
   * Upload responses must be mapped by this value, never by array index.
   */
  id: string
  name: string
  file?: File
  fileInfo?: CreatePostImageFileInfo
  previewUrl?: string
  aspectRatio: AspectRatio
  filter: ImageFilter
  exported?: {
    file: File
    objectUrl: string
    fileInfo: CreatePostImageFileInfo
  }
  upload?: {
    fileId?: string
    uploadUrl?: string
    expiresAt?: string
    status: CreatePostUploadStatus
    error?: string
  }
}

export type CreatePostState = {
  step: CreatePostStep
  images: CreatePostImage[]
  activeImageId: string | null
  caption: string
  hasUnsavedData: boolean
  isPublishing: boolean
}

export type CreatePostAction =
  | { type: 'goToStep'; step: CreatePostStep }
  | { type: 'goBack' }
  | { type: 'goNext' }
  | { type: 'reset' }
  | { type: 'addImages'; images: CreatePostImage[] }
  | { type: 'removeImage'; imageId: string }
  | { type: 'setActiveImage'; imageId: string | null }
  | { type: 'setCaption'; caption: string }
  | { type: 'setImageAspectRatio'; aspectRatio: AspectRatio; imageId: string }
  | { type: 'setImageFilter'; filter: ImageFilter; imageId: string }
  /**
   * Final file produced by crop/filter/export pipeline.
   *
   * This file is later used by:
   * initiateUploadBatch
   * -> storage PUT
   * -> completeUpload
   * -> createPost
   */
  | {
      type: 'setImageExported'
      imageId: string
      exported: CreatePostImage['exported']
    }
  /**
   * Merges upload data into images by imageId/clientUploadId.
   *
   * Used by upload integration after:
   * - initiateUploadBatch
   * - storage PUT
   * - completeUpload
   */
  | {
      type: 'applyUploadBatchState'
      patches: CreatePostUploadPatch[]
    }
  /**
   * Global publish flow state.
   *
   * Prevents duplicate publish requests while:
   * initiateUploadBatch
   * -> upload
   * -> completeUpload
   * -> createPost
   */
  | {
      type: 'setPublishing'
      isPublishing: boolean
    }
