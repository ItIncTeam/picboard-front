import type { PostAuthor, PostImage } from '@/entities/post'

export type PublicPostCardModel = {
  author: PostAuthor | null
  createdAt: string
  description: string
  id: string
  media: PostImage[]
}
