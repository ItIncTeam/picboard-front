import type { PostImage } from '@/entities/post'

export type PublicPostCardModel = {
  author: {
    avatarUrl: string | null
    name: string
  }
  createdAt: string
  description: string
  id: string
  media: PostImage[]
}
