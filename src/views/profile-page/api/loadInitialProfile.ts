import { z } from 'zod'

import { PROFILE_POSTS_PAGE_SIZE } from '@/entities/post/api/profilePostsConstants'

import { initialProfileResponseSchema, type InitialProfileData } from './initialProfileData'
import { initialProfileQuery } from './initialProfileQuery'

const envelopeSchema = z.object({
  data: z.unknown(),
  errors: z
    .array(z.object({ path: z.array(z.union([z.string(), z.number()])).optional() }))
    .optional(),
})

export async function loadInitialProfile(userId: string): Promise<InitialProfileData | null> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
  if (!endpoint || !URL.canParse(endpoint))
    throw new Error('Public Profile endpoint is not configured.')

  const response = await fetch(endpoint, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'omit',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: initialProfileQuery,
      variables: { id: userId, input: { userId, first: PROFILE_POSTS_PAGE_SIZE } },
    }),
  })
  if (!response.ok) throw new Error('Public Profile request failed.')

  const payload = envelopeSchema.parse(await response.json())
  const data = initialProfileResponseSchema.parse(payload.data)

  for (const { path } of payload.errors ?? []) {
    const [root, edges, index, node, author, ...fields] = path ?? []
    const authorFields = ['id', 'username', 'displayName', 'profilePictureFileId', '__typename']
    const isAuthorPath =
      fields.length === 0 ||
      (fields.length === 1 && authorFields.includes(String(fields[0]))) ||
      (fields[0] === 'avatar' &&
        (fields.length === 1 ||
          (fields.length === 2 && ['id', 'url', '__typename'].includes(String(fields[1])))))

    if (
      !data.user ||
      root !== 'profilePosts' ||
      edges !== 'edges' ||
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      !data.profilePosts.edges[index] ||
      node !== 'node' ||
      author !== 'author' ||
      !isAuthorPath
    ) {
      throw new Error('Public Profile GraphQL request failed.')
    }
  }

  if (data.user === null) return null

  return { user: data.user, posts: data.profilePosts, baselineKey: crypto.randomUUID() }
}
