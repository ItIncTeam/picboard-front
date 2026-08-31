'use client'

import { useQuery } from '@apollo/client/react'

import { feedQuery, mapPostEntitiesToPosts, PostGrid, type FeedQueryData } from '@/entities/post'
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

export function MainPage() {
  const { data, error, loading, refetch } = useQuery<FeedQueryData>(feedQuery, {
    notifyOnNetworkStatusChange: false,
    pollInterval: 60_000,
  })

  const retryFeed = () => {
    void refetch().catch(() => undefined)
  }

  let content: React.ReactNode

  if (loading && !data) {
    content = <PostGrid isLoading skeletonCount={4} />
  } else if (error && !data) {
    content = <PostGrid isError onRetry={retryFeed} />
  } else {
    const posts = data ? toPublicPostCardModels(data) : []
    content = posts.length > 0 ? <PublicPostsGrid posts={posts} /> : <PostGrid posts={[]} />
  }

  return (
    <section aria-labelledby="main-feed-title" className={styles.root}>
      <h1 className={styles.visuallyHidden} id="main-feed-title">
        Latest posts
      </h1>
      {data ? <RegisteredUsersCounter usersCount={data.usersCount} /> : null}
      <div className={styles.feed}>{content}</div>
    </section>
  )
}
