import type { PostAuthor, PostImage } from '@/entities/post'

export type PublicPostCardModel = {
  author: PostAuthor
  createdAt: string
  description: string
  id: string
  media: PostImage[]
}
