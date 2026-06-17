// Frontend display model for posts UI skeletons. This is not a backend contract.
export type PostImage = {
  id: string
  alt: string
  url: string
}

export type Post = {
  id: string
  authorName: string
  caption?: string
  createdAtLabel?: string
  images: PostImage[]
}
