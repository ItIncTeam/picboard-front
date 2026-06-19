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

export type CreatePostImage = {
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
    clientUploadId: string
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
