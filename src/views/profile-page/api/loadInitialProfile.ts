import { z } from 'zod'

import { PROFILE_POSTS_PAGE_SIZE } from '@/entities/post/api/profilePostsConstants'
import { isConsistentProfilePostsAuthorError } from '@/entities/post/lib/graphqlAuthorErrors'

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
    if (!data.user || !isConsistentProfilePostsAuthorError(path, data.profilePosts)) {
      throw new Error('Public Profile GraphQL request failed.')
    }
  }

  if (data.user === null) return null

  return { user: data.user, posts: data.profilePosts, baselineKey: crypto.randomUUID() }
}
