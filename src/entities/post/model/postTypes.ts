import type { PostAuthor } from './backendTypes'

export type PostImage = {
  id: string
  alt: string
  url: string
}

export type Post = {
  author: PostAuthor
  id: string
  caption?: string
  createdAtLabel?: string
  images: PostImage[]
  ownerId: string
}
