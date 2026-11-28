'use client'

import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { useEffect, useEffectEvent, useState } from 'react'

import {
  feedQuery,
  isConsistentFeedAuthorError,
  isPostEntity,
  mapPostEntitiesToPosts,
  PostGrid,
  type FeedQueryData,
} from '@/entities/post'
import { PublicPostsGrid } from '@/widgets/public-posts-grid'
import type { PublicPostCardModel } from '@/widgets/public-post-card'
import { RegisteredUsersCounter } from '@/widgets/registered-users-counter'

import styles from './main-page.module.css'

function toPublicPostCardModels(data: FeedQueryData): PublicPostCardModel[] {
  return mapPostEntitiesToPosts(data.feed).map((post) => ({
    author: post.author,
    createdAt: post.createdAtLabel ?? '',
    description: post.caption ?? '',
    id: post.id,
    media: post.images,
  }))
}

function hasUsableFeedData(data: FeedQueryData | null | undefined): data is FeedQueryData {
  return Boolean(
    data &&
    Array.isArray(data.feed) &&
    data.feed.every(isPostEntity) &&
    typeof data.usersCount === 'number',
  )
}

export function MainPage() {
  const apolloClient = useApolloClient()
  const { data } = useQuery<FeedQueryData>(feedQuery, {
    fetchPolicy: 'cache-only',
  })
  const [requestStatus, setRequestStatus] = useState<'error' | 'loading' | 'ready'>(() =>
    hasUsableFeedData(data) ? 'ready' : 'loading',
  )
  const [retryVersion, setRetryVersion] = useState(0)

  const loadFeed = useEffectEvent(async () => {
    try {
      const response = await apolloClient.query<FeedQueryData>({
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
        query: feedQuery,
      })
      const payload = response.data?.feed
      const usersCount = response.data?.usersCount

      if (!payload || !payload.every(isPostEntity) || typeof usersCount !== 'number') {
        throw new Error('Feed loading failed. Please try again.')
      }

      if (response.error) {
        if (!CombinedGraphQLErrors.is(response.error)) {
          throw response.error
        }

        for (const graphQLError of response.error.errors) {
          if (!isConsistentFeedAuthorError(graphQLError.path, payload)) {
            throw response.error
          }
        }
      }

      apolloClient.writeQuery({
        data: {
          feed: payload,
          usersCount,
        },
        query: feedQuery,
      })
      setRequestStatus('ready')
    } catch {
      const cached = apolloClient.readQuery<FeedQueryData>({ query: feedQuery })
      setRequestStatus(hasUsableFeedData(cached) ? 'ready' : 'error')
    }
  })

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadFeed()
    }, 0)
    const pollTimer = window.setInterval(() => {
      void loadFeed()
    }, 60_000)

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(pollTimer)
    }
  }, [retryVersion])

  const retryFeed = () => {
    if (!hasUsableFeedData(data)) {
      setRequestStatus('loading')
    }
    setRetryVersion((version) => version + 1)
  }

  let content: React.ReactNode

  if (requestStatus === 'loading' && !hasUsableFeedData(data)) {
    content = <PostGrid isLoading skeletonCount={4} />
  } else if (requestStatus === 'error' && !hasUsableFeedData(data)) {
    content = <PostGrid isError onRetry={retryFeed} />
  } else {
    const posts = hasUsableFeedData(data) ? toPublicPostCardModels(data) : []
    content = posts.length > 0 ? <PublicPostsGrid posts={posts} /> : <PostGrid posts={[]} />
  }

  return (
    <section aria-labelledby="main-feed-title" className={styles.root}>
      <h1 className={styles.visuallyHidden} id="main-feed-title">
        Latest posts
      </h1>
      {hasUsableFeedData(data) ? <RegisteredUsersCounter usersCount={data.usersCount} /> : null}
      <div className={styles.feed}>{content}</div>
    </section>
  )
}
