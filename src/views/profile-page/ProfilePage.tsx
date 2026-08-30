'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  mapPostEntitiesToPosts,
  PostGrid,
  PROFILE_POSTS_PAGE_SIZE,
  profilePosts,
  type PageInfo,
  type PostEntity,
} from '@/entities/post'
import { getUser, type PublicUser } from '@/entities/user'
import { useSession } from '@/features/auth/session-management'
import { PersonIcon } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { RoutePlaceholder } from '@/views/route-placeholder'

import styles from './profile-page.module.css'

type ProfilePageProps = {
  userId: string
}

type ProfileState =
  | { status: 'error'; message: string; userId: string }
  | { status: 'loading'; userId: string }
  | { status: 'not-found'; userId: string }
  | {
      status: 'ready'
      pageInfo: PageInfo
      posts: PostEntity[]
      user: PublicUser
      userId: string
    }

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Profile loading failed. Please try again.'
}

function mergePosts(currentPosts: PostEntity[], nextPosts: PostEntity[]): PostEntity[] {
  const currentIds = new Set(currentPosts.map(({ id }) => id))

  return [...currentPosts, ...nextPosts.filter(({ id }) => !currentIds.has(id))]
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { status: sessionStatus, user: sessionUser } = useSession()
  const [profileState, setProfileState] = useState<ProfileState>({ status: 'loading', userId })
  const [retryVersion, setRetryVersion] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    loadingMoreRef.current = false

    void Promise.all([getUser(userId), profilePosts({ first: PROFILE_POSTS_PAGE_SIZE, userId })])
      .then(([user, postsConnection]) => {
        if (requestIdRef.current !== requestId) {
          return
        }

        if (!user) {
          setIsLoadingMore(false)
          setLoadMoreError(null)
          setProfileState({ status: 'not-found', userId })
          return
        }

        setIsLoadingMore(false)
        setLoadMoreError(null)
        setProfileState({
          status: 'ready',
          pageInfo: postsConnection.pageInfo,
          posts: postsConnection.edges.map(({ node }) => node),
          user,
          userId,
        })
      })
      .catch((error: unknown) => {
        if (requestIdRef.current === requestId) {
          setIsLoadingMore(false)
          setLoadMoreError(null)
          setProfileState({ status: 'error', message: getErrorMessage(error), userId })
        }
      })

    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1
      }
    }
  }, [retryVersion, userId])

  const loadMore = useCallback(async () => {
    if (
      profileState.status !== 'ready' ||
      profileState.userId !== userId ||
      loadingMoreRef.current ||
      !profileState.pageInfo.hasNextPage ||
      !profileState.pageInfo.endCursor
    ) {
      return
    }

    const requestId = requestIdRef.current
    loadingMoreRef.current = true
    setIsLoadingMore(true)
    setLoadMoreError(null)

    try {
      const nextConnection = await profilePosts({
        after: profileState.pageInfo.endCursor,
        first: PROFILE_POSTS_PAGE_SIZE,
        userId,
      })

      if (requestIdRef.current !== requestId) {
        return
      }

      setProfileState((currentState) =>
        currentState.status === 'ready'
          ? {
              ...currentState,
              pageInfo: nextConnection.pageInfo,
              posts: mergePosts(
                currentState.posts,
                nextConnection.edges.map(({ node }) => node),
              ),
            }
          : currentState,
      )
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setLoadMoreError(getErrorMessage(error))
      }
    } finally {
      if (requestIdRef.current === requestId) {
        loadingMoreRef.current = false
        setIsLoadingMore(false)
      }
    }
  }, [profileState, userId])

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (
      !sentinel ||
      profileState.status !== 'ready' ||
      !profileState.pageInfo.hasNextPage ||
      loadMoreError
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [loadMore, loadMoreError, profileState])

  const currentProfileState: ProfileState =
    profileState.userId === userId ? profileState : { status: 'loading', userId }

  if (currentProfileState.status === 'loading') {
    return (
      <section aria-labelledby="profile-title" className={styles.root}>
        <h1 className={styles.visuallyHidden} id="profile-title">
          Profile
        </h1>
        <div aria-live="polite" className={styles.profileLoading} role="status">
          Loading profile...
        </div>
        <PostGrid isLoading skeletonCount={PROFILE_POSTS_PAGE_SIZE} />
      </section>
    )
  }

  if (currentProfileState.status === 'error') {
    return (
      <section aria-labelledby="profile-title" className={styles.root}>
        <h1 className={styles.visuallyHidden} id="profile-title">
          Profile
        </h1>
        <PostGrid
          errorMessage={currentProfileState.message}
          isError
          onRetry={() => {
            setProfileState({ status: 'loading', userId })
            setRetryVersion((version) => version + 1)
          }}
        />
      </section>
    )
  }

  if (currentProfileState.status === 'not-found') {
    return (
      <section aria-labelledby="profile-title" className={styles.notFound}>
        <h1 id="profile-title">Profile not found</h1>
        <p>The requested user does not exist or is unavailable.</p>
      </section>
    )
  }

  const isOwner = sessionStatus === 'authenticated' && sessionUser?.id === userId
  const posts = mapPostEntitiesToPosts(currentProfileState.posts)

  return (
    <section aria-labelledby="profile-title" className={styles.root}>
      <header className={styles.profileHeader}>
        <div
          aria-label={`${currentProfileState.user.username} avatar`}
          className={styles.avatar}
          role="img"
        >
          <PersonIcon aria-hidden className={styles.avatarIcon} focusable="false" />
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.identityRow}>
            <div>
              <h1 className={styles.username} id="profile-title">
                {currentProfileState.user.username}
              </h1>
              {currentProfileState.user.displayName && (
                <p className={styles.displayName}>{currentProfileState.user.displayName}</p>
              )}
            </div>

            {isOwner && (
              <Button asChild variant="outlined">
                <Link href="/settings/profile">Profile Settings</Link>
              </Button>
            )}
          </div>

          <div className={styles.about}>
            <h2 className={styles.aboutTitle}>About me</h2>
            <p className={styles.bio}>
              {currentProfileState.user.bio || 'No information provided.'}
            </p>
          </div>
        </div>
      </header>

      <div className={styles.publications}>
        <h2 className={styles.publicationsTitle}>Publications</h2>
        <PostGrid posts={posts} returnTo={`/profile/${userId}`} />

        {loadMoreError && (
          <div className={styles.loadMoreError} role="alert">
            <p>{loadMoreError}</p>
            <Button onClick={() => void loadMore()} type="button" variant="outlined">
              Try again
            </Button>
          </div>
        )}

        {isLoadingMore && (
          <p aria-live="polite" className={styles.loadingMore} role="status">
            Loading more publications...
          </p>
        )}

        <div
          ref={sentinelRef}
          aria-hidden="true"
          className={styles.sentinel}
          data-testid="profile-posts-sentinel"
        />
      </div>
    </section>
  )
}

export function ProfileRelationsPage() {
  return (
    <RoutePlaceholder
      description="Protected profile relations route."
      title="Profile relations"
      routes={['/profile/[userId]/followers', '/profile/[userId]/subscriptions']}
    />
  )
}
