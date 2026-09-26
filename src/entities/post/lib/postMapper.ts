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
    author: entity.author,
    id: entity.id,
    caption: entity.description ?? undefined,
    createdAtLabel: entity.createdAt,
    images,
    ownerId: entity.ownerId,
  }
}

export function mapPostEntitiesToPosts(entities: PostEntity[]): Post[] {
  return entities.map(mapPostEntityToPost)
}
