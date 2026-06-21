import { CREATE_POST_FILTERS } from '../lib/createPostConstants'
import type { CreatePostImage, ImageFilter } from '../model/createPostTypes'
import { CreatePostSkeleton } from './CreatePostSkeleton'

export type FiltersStepProps = {
  activeImage: CreatePostImage | null
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

export function FiltersStep({
  activeImage: _activeImage,
  onFilterChange: _onFilterChange,
  onImageExported: _onImageExported,
}: FiltersStepProps) {
  return (
    <CreatePostSkeleton
      description={`Filters boundary only. Planned presets: ${CREATE_POST_FILTERS.join(', ')}.`}
      title="Filters"
    />
  )
}
