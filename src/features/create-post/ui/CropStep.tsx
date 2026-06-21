import { CREATE_POST_ASPECT_RATIOS } from '../lib/createPostConstants'
import type { AspectRatio, CreatePostImage } from '../model/createPostTypes'
import { CreatePostSkeleton } from './CreatePostSkeleton'

export type CropStepProps = {
  activeImage: CreatePostImage | null
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

export function CropStep({
  activeImage: _activeImage,
  onAspectRatioChange: _onAspectRatioChange,
  onImageExported: _onImageExported,
}: CropStepProps) {
  return (
    <CreatePostSkeleton
      description={`Crop boundary only. Planned aspect ratios: ${CREATE_POST_ASPECT_RATIOS.join(', ')}.`}
      title="Cropping"
    />
  )
}
