import { CREATE_POST_ASPECT_RATIOS } from '../lib/createPostConstants'
import { CreatePostSkeleton } from './CreatePostSkeleton'

export function CropStep() {
  return (
    <CreatePostSkeleton
      description={`Crop boundary only. Planned aspect ratios: ${CREATE_POST_ASPECT_RATIOS.join(', ')}.`}
      title="Cropping"
    />
  )
}
