import type { PublicHomePost } from '../PublicHomePage'

type HomepageFile = {
  originalName?: string | null
  url: string | null
}

type HomepageAttachment = {
  file: HomepageFile | null
  fileId?: string
  order?: number
}

type HomepagePost = {
  attachments: HomepageAttachment[]
  createdAt?: string
  description: string | null
  id: string
  ownerId?: string
}

type HomepageResponse = {
  feed: HomepagePost[]
  usersCount: number
}

type GraphqlResponse<TData> = {
  data?: TData
  errors?: unknown[]
}

export type PublicHomeData = {
  posts: PublicHomePost[]
  usersCount: number
}

const publicHomePostsLimit = 4

const homepageQuery = `
  query Homepage {
    usersCount
    feed {
      id
      ownerId
      description
      createdAt
      attachments {
        fileId
        order
        file {
          originalName
          url
        }
      }
    }
  }
`

const fallbackPublicHomeData: PublicHomeData = {
  posts: [],
  usersCount: 0,
}

function getGraphqlEndpoint(): string | null {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT

  if (!endpoint || endpoint.startsWith('/')) {
    return null
  }

  return endpoint
}

function formatCreatedAtLabel(createdAt: string | undefined): string {
  if (!createdAt) {
    return ''
  }

  return createdAt
}

function mapHomepagePostToPublicHomePost(post: HomepagePost): PublicHomePost | null {
  const firstImage = [...post.attachments]
    .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
    .find((attachment) => attachment.file?.url)

  if (!firstImage?.file?.url) {
    return null
  }

  const authorName = post.ownerId ? `User ${post.ownerId}` : 'UserName'
  const imageAlt = firstImage.file.originalName || 'Public post image'

  return {
    authorAvatarUrl: '',
    authorName,
    caption: post.description ?? '',
    createdAtLabel: formatCreatedAtLabel(post.createdAt),
    id: post.id,
    imageAlt,
    imageUrl: firstImage.file.url,
  }
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const endpoint = getGraphqlEndpoint()

  if (!endpoint) {
    return fallbackPublicHomeData
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      query: homepageQuery,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    next: {
      revalidate: 60,
    },
  }).catch(() => null)

  if (!response?.ok) {
    return fallbackPublicHomeData
  }

  const payload = (await response.json()) as GraphqlResponse<HomepageResponse>

  if (!payload.data) {
    return fallbackPublicHomeData
  }

  return {
    posts: payload.data.feed
      .flatMap((post) => {
        const mappedPost = mapHomepagePostToPublicHomePost(post)

        return mappedPost ? [mappedPost] : []
      })
      .slice(0, publicHomePostsLimit),
    usersCount: payload.data.usersCount,
  }
}
