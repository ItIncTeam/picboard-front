import type { Post } from '@/entities/post'
import type { PostEntity } from '@/entities/post'

export function mapPostEntityToPost(entity: PostEntity): Post {
  const images = [...entity.attachments]
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .flatMap((attachment) => {
      if (!attachment.file) {
        return []
      }

      return [
        {
          id: attachment.fileId,
          alt: attachment.file.originalName,
          url: attachment.file.url,
        },
      ]
    })

  return {
    id: entity.id,
    // TODO: Replace fallback author data when PostEntity exposes author info.
    // Avoid per-post user(ownerId) requests in feeds to prevent N+1 queries.
    authorName: entity.ownerId,
    caption: entity.description ?? undefined,
    createdAtLabel: entity.createdAt,
    images,
  }
}

export function mapPostEntitiesToPosts(entities: PostEntity[]): Post[] {
  return entities.map(mapPostEntityToPost)
}
