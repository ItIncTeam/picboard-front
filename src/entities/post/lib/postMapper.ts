import type { Post } from '@/entities/post'
import type { PostEntity } from '@/entities/post'

export function mapPostEntityToPost(entity: PostEntity): Post {
  const images = [...entity.attachments]
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((attachment) => ({
      id: attachment.fileId,
      alt: attachment.file.originalName,
      url: attachment.file.url,
    }))

  return {
    id: entity.id,
    // Backend PostEntity does not expose username/displayName yet.
    authorName: entity.ownerId,
    caption: entity.description ?? undefined,
    createdAtLabel: entity.createdAt,
    images,
  }
}

export function mapPostEntitiesToPosts(entities: PostEntity[]): Post[] {
  return entities.map(mapPostEntityToPost)
}
