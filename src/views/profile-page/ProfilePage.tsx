'use client'

import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import {
  mapPostEntitiesToPosts,
  PostGrid,
  PROFILE_POSTS_PAGE_SIZE,
  profilePostsQuery,
  type PageInfo,
  type PostEntity,
  type ProfilePostsQueryData,
  type ProfilePostsQueryVariables,
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

type ProfileUserState =
  | { status: 'error'; message: string; userId: string }
  | { status: 'loading'; userId: string }
  | { status: 'not-found'; userId: string }
  | { status: 'ready'; user: PublicUser; userId: string }

type PaginationState = {
  firstPageSnapshot: PostEntity[]
  hasFirstPageSnapshot: boolean
  history: PostEntity[]
  pageInfo: PageInfo | null
  revision: number
  userId: string
}

type PaginationStatus = {
  error: string | null
  isLoading: boolean
  revision: number
  userId: string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Profile loading failed. Please try again.'
}

function mergePosts(currentPosts: PostEntity[], nextPosts: PostEntity[]): PostEntity[] {
  const currentIds = new Set(currentPosts.map(({ id }) => id))

  return [...currentPosts, ...nextPosts.filter(({ id }) => !currentIds.has(id))]
}

function hasSamePostOrder(previousPosts: PostEntity[], currentPosts: PostEntity[]): boolean {
  return (
    previousPosts.length === currentPosts.length &&
    previousPosts.every(({ id }, index) => id === currentPosts[index]?.id)
  )
}

function createPaginationState(userId: string): PaginationState {
  return {
    firstPageSnapshot: [],
    hasFirstPageSnapshot: false,
    history: [],
    pageInfo: null,
    revision: 0,
    userId,
  }
}

function reconcileFirstPage(
  state: PaginationState,
  firstPagePosts: PostEntity[],
  firstPageInfo: PageInfo,
): PaginationState {
  if (!state.hasFirstPageSnapshot) {
    return {
      ...state,
      firstPageSnapshot: firstPagePosts,
      hasFirstPageSnapshot: true,
      pageInfo: firstPageInfo,
    }
  }

  if (hasSamePostOrder(state.firstPageSnapshot, firstPagePosts)) {
    const hasSamePostReferences = state.firstPageSnapshot.every(
      (post, index) => post === firstPagePosts[index],
    )

    return hasSamePostReferences ? state : { ...state, firstPageSnapshot: firstPagePosts }
  }

  const currentFirstPageIds = new Set(firstPagePosts.map(({ id }) => id))
  const displacedPosts = state.firstPageSnapshot.filter(({ id }) => !currentFirstPageIds.has(id))

  return {
    ...state,
    firstPageSnapshot: firstPagePosts,
    history: mergePosts(displacedPosts, state.history),
    pageInfo: firstPageInfo,
    revision: state.revision + 1,
  }
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { status: sessionStatus, user: sessionUser } = useSession()
  const [profileUserState, setProfileUserState] = useState<ProfileUserState>({
    status: 'loading',
    userId,
  })
  const [paginationState, setPaginationState] = useState<PaginationState>(() =>
    createPaginationState(userId),
  )
  const [retryVersion, setRetryVersion] = useState(0)
  const [paginationStatus, setPaginationStatus] = useState<PaginationStatus>({
    error: null,
    isLoading: false,
    revision: 0,
    userId,
  })
  const requestIdRef = useRef(0)
  const loadingMoreRequestRef = useRef<symbol | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const {
    data: profilePostsData,
    error: profilePostsError,
    fetchMore,
    loading: profilePostsLoading,
    refetch: refetchProfilePosts,
    variables: profilePostsVariables,
  } = useQuery<ProfilePostsQueryData, ProfilePostsQueryVariables>(profilePostsQuery, {
    notifyOnNetworkStatusChange: false,
    pollInterval: 60_000,
    variables: {
      input: { first: PROFILE_POSTS_PAGE_SIZE, userId },
    },
  })

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    loadingMoreRequestRef.current = null

    void getUser(userId)
      .then((user) => {
        if (requestIdRef.current !== requestId) {
          return
        }

        if (!user) {
          setProfileUserState({ status: 'not-found', userId })
          return
        }

        setProfileUserState({ status: 'ready', user, userId })
      })
      .catch((error: unknown) => {
        if (requestIdRef.current === requestId) {
          setProfileUserState({ status: 'error', message: getErrorMessage(error), userId })
        }
      })

    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1
      }
    }
  }, [retryVersion, userId])

  const firstPageConnection =
    profilePostsVariables.input.userId === userId ? profilePostsData?.profilePosts : undefined
  const firstPagePosts = firstPageConnection?.edges.map(({ node }) => node) ?? []
  const resetPaginationState =
    paginationState.userId === userId ? paginationState : createPaginationState(userId)
  const currentPaginationState = firstPageConnection
    ? reconcileFirstPage(resetPaginationState, firstPagePosts, firstPageConnection.pageInfo)
    : resetPaginationState

  if (currentPaginationState !== paginationState) {
    setPaginationState(currentPaginationState)
  }

  const paginationPageInfo = currentPaginationState.pageInfo
  const paginationEndCursor = paginationPageInfo?.endCursor
  const paginationHasNextPage = paginationPageInfo?.hasNextPage ?? false
  const currentPaginationStatus: PaginationStatus =
    paginationStatus.userId === userId &&
    paginationStatus.revision === currentPaginationState.revision
      ? paginationStatus
      : { error: null, isLoading: false, revision: currentPaginationState.revision, userId }

  useEffect(() => {
    loadingMoreRequestRef.current = null
  }, [currentPaginationState.revision])

  const loadMore = async () => {
    if (loadingMoreRequestRef.current || !paginationHasNextPage || !paginationEndCursor) {
      return
    }

    const requestId = requestIdRef.current
    const paginationRevision = currentPaginationState.revision
    const paginationRequest = Symbol('profile-pagination-request')
    loadingMoreRequestRef.current = paginationRequest
    setPaginationStatus({ error: null, isLoading: true, revision: paginationRevision, userId })

    try {
      const response = await fetchMore({
        variables: {
          input: {
            after: paginationEndCursor,
            first: PROFILE_POSTS_PAGE_SIZE,
            userId,
          },
        },
      })
      const nextConnection = response.data?.profilePosts

      if (requestIdRef.current !== requestId || !nextConnection) {
        return
      }

      setPaginationState((currentState) => {
        if (currentState.userId !== userId || currentState.revision !== paginationRevision) {
          return currentState
        }

        const firstPageIds = new Set(currentState.firstPageSnapshot.map(({ id }) => id))
        const nextHistoryPosts = nextConnection.edges
          .map(({ node }) => node)
          .filter(({ id }) => !firstPageIds.has(id))

        return {
          ...currentState,
          history: mergePosts(currentState.history, nextHistoryPosts),
          pageInfo: nextConnection.pageInfo,
        }
      })
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setPaginationStatus((currentStatus) =>
          currentStatus.userId === userId && currentStatus.revision === paginationRevision
            ? { ...currentStatus, error: getErrorMessage(error), isLoading: false }
            : currentStatus,
        )
      }
    } finally {
      if (
        requestIdRef.current === requestId &&
        loadingMoreRequestRef.current === paginationRequest
      ) {
        loadingMoreRequestRef.current = null
        setPaginationStatus((currentStatus) =>
          currentStatus.userId === userId && currentStatus.revision === paginationRevision
            ? { ...currentStatus, isLoading: false }
            : currentStatus,
        )
      }
    }
  }

  const loadMoreOnIntersection = useEffectEvent(() => {
    void loadMore()
  })

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (
      !sentinel ||
      profileUserState.status !== 'ready' ||
      !paginationHasNextPage ||
      currentPaginationStatus.error
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          loadMoreOnIntersection()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [
    currentPaginationState.revision,
    currentPaginationStatus.error,
    paginationHasNextPage,
    profileUserState.status,
  ])

  const currentProfileUserState: ProfileUserState =
    profileUserState.userId === userId ? profileUserState : { status: 'loading', userId }
  const hasUsablePostsData = Boolean(firstPageConnection)

  if (
    currentProfileUserState.status === 'loading' ||
    (profilePostsLoading && !hasUsablePostsData)
  ) {
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

  if (currentProfileUserState.status === 'error' || (profilePostsError && !hasUsablePostsData)) {
    return (
      <section aria-labelledby="profile-title" className={styles.root}>
        <h1 className={styles.visuallyHidden} id="profile-title">
          Profile
        </h1>
        <PostGrid
          errorMessage={
            currentProfileUserState.status === 'error'
              ? currentProfileUserState.message
              : getErrorMessage(profilePostsError)
          }
          isError
          onRetry={() => {
            setProfileUserState({ status: 'loading', userId })
            setPaginationStatus({
              error: null,
              isLoading: false,
              revision: currentPaginationState.revision,
              userId,
            })
            setRetryVersion((version) => version + 1)
            void refetchProfilePosts().catch(() => undefined)
          }}
        />
      </section>
    )
  }

  if (currentProfileUserState.status === 'not-found') {
    return (
      <section aria-labelledby="profile-title" className={styles.notFound}>
        <h1 id="profile-title">Profile not found</h1>
        <p>The requested user does not exist or is unavailable.</p>
      </section>
    )
  }

  if (currentProfileUserState.status !== 'ready') {
    return null
  }

  const isOwner = sessionStatus === 'authenticated' && sessionUser?.id === userId
  const posts = mapPostEntitiesToPosts(mergePosts(firstPagePosts, currentPaginationState.history))

  return (
    <section aria-labelledby="profile-title" className={styles.root}>
      <header className={styles.profileHeader}>
        <div
          aria-label={`${currentProfileUserState.user.username} avatar`}
          className={styles.avatar}
          role="img"
        >
          <PersonIcon aria-hidden className={styles.avatarIcon} focusable="false" />
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.identityRow}>
            <div>
              <h1 className={styles.username} id="profile-title">
                {currentProfileUserState.user.username}
              </h1>
              {currentProfileUserState.user.displayName && (
                <p className={styles.displayName}>{currentProfileUserState.user.displayName}</p>
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
              {currentProfileUserState.user.bio || 'No information provided.'}
            </p>
          </div>
        </div>
      </header>

      <div className={styles.publications}>
        <h2 className={styles.publicationsTitle}>Publications</h2>
        <PostGrid posts={posts} returnTo={`/profile/${userId}`} />

        {currentPaginationStatus.error && (
          <div className={styles.loadMoreError} role="alert">
            <p>{currentPaginationStatus.error}</p>
            <Button onClick={() => void loadMore()} type="button" variant="outlined">
              Try again
            </Button>
          </div>
        )}

        {currentPaginationStatus.isLoading && (
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
