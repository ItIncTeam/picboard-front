// Frontend-only in-memory UI flow state. This is not product draft persistence
// and not a backend contract.
export type CreatePostStep = 'upload' | 'crop' | 'filters' | 'publication'

export type AspectRatio = 'original' | '1:1' | '4:5' | '16:9'

export type ImageFilter = 'normal' | 'clarendon' | 'lark' | 'gingham' | 'moon'

export type CreatePostImage = {
  id: string
  name: string
  previewUrl?: string
  aspectRatio: AspectRatio
  filter: ImageFilter
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
