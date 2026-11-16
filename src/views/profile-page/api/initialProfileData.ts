import { z } from 'zod'

import type { PostEntity } from '@/entities/post/model/backendTypes'
import type { PublicUser } from '@/entities/user/api/usersApi'

const avatarSchema = z
  .object({
    __typename: z.literal('File'),
    id: z.string(),
    url: z.string(),
  })
  .nullable()

const authorSchema = z.object({
  __typename: z.literal('User'),
  id: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  profilePictureFileId: z.string().nullable(),
  avatar: avatarSchema,
})

const userSchema = authorSchema.extend({
  aboutMe: z.string().nullable(),
}) satisfies z.ZodType<PublicUser>

const postSchema = z.object({
  __typename: z.literal('PostEntity'),
  id: z.string(),
  ownerId: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: authorSchema.nullable(),
  attachments: z.array(
    z.object({
      __typename: z.literal('PostAttachmentEntity'),
      fileId: z.string(),
      sortOrder: z.number(),
      file: z
        .object({
          __typename: z.literal('File'),
          id: z.string(),
          ownerId: z.string(),
          originalName: z.string(),
          purpose: z.enum(['POST_IMAGE', 'BILL']),
          mimeType: z.enum(['JPEG', 'PNG']),
          size: z.number(),
          status: z.enum(['PENDING', 'UPLOADED', 'READY', 'FAILED', 'DELETED']),
          url: z.string(),
        })
        .nullable(),
    }),
  ),
}) satisfies z.ZodType<PostEntity>

export const initialProfileResponseSchema = z.object({
  user: userSchema.nullable(),
  profilePosts: z.object({
    __typename: z.literal('PostConnection'),
    edges: z.array(
      z.object({
        __typename: z.literal('PostEdge'),
        cursor: z.string(),
        node: postSchema,
      }),
    ),
    pageInfo: z.object({
      __typename: z.literal('PageInfo'),
      startCursor: z.string().nullable(),
      endCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  }),
})

export type InitialProfileData = {
  baselineKey: string
  user: z.infer<typeof userSchema>
  posts: z.infer<typeof initialProfileResponseSchema>['profilePosts']
}
