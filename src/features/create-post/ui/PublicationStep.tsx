import type { CreatePostImage } from '@/features/create-post'
import { CreatePostSkeleton } from './CreatePostSkeleton'

export type PublicationStepProps = {
  caption: string
  images: CreatePostImage[]
  onCaptionChange: (caption: string) => void
}

export function PublicationStep({
  caption: _caption,
  images: _images,
  onCaptionChange: _onCaptionChange,
}: PublicationStepProps) {
  return (
    <CreatePostSkeleton
      description="Publication boundary only. Caption UI and publish integration wait for later PRs."
      title="Publication"
    />
  )
}
