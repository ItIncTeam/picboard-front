import { mapPostEntitiesToPosts, type PublicHomeQueryData } from '@/entities/post'
import type { PublicPostCardModel } from '@/widgets/public-post-card'

export type PublicHomeDisplayModel = {
  posts: PublicPostCardModel[]
  usersCount: number
}

const PUBLIC_HOME_POSTS_LIMIT = 4

export function createPublicHomeDisplayModel(data: PublicHomeQueryData): PublicHomeDisplayModel {
  const posts = mapPostEntitiesToPosts(data.feed.slice(0, PUBLIC_HOME_POSTS_LIMIT)).map((post) => ({
    author: {
      avatarUrl: null,
      name: 'User',
    },
    createdAt: post.createdAtLabel ?? '',
    description: post.caption ?? '',
    id: post.id,
    media: post.images,
  }))

  return {
    posts,
    usersCount: data.usersCount,
  }
}
