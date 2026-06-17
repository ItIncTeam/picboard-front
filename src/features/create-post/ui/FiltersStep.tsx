import { CREATE_POST_FILTERS } from '../lib/createPostConstants'
import { CreatePostSkeleton } from './CreatePostSkeleton'

export function FiltersStep() {
  return (
    <CreatePostSkeleton
      description={`Filters boundary only. Planned presets: ${CREATE_POST_FILTERS.join(', ')}.`}
      title="Filters"
    />
  )
}
