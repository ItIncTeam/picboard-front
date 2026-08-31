'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { mapPostEntityToPost, post, PostDetails, PostGrid, type PostEntity } from '@/entities/post'
import { useSession } from '@/features/auth/session-management'
import { DeletePostFlow } from '@/features/delete-post'
import { EditPostForm, EditPostMenu } from '@/features/edit-post'
import { Close } from '@/shared/assets'
import { getSafeReturnToPath } from '@/shared/lib/auth'
import { IconButton } from '@/shared/ui/icon-button'
import { Modal } from '@/shared/ui/modal'
import { formatRelativePostTime, PublicPostCarousel } from '@/widgets/public-post-card'

import styles from './post-details-page.module.css'

type PostDetailsPageProps = {
  postId: string
}

type PostDetailsState =
  | { message: string; postId: string; status: 'error' }
  | { postId: string; status: 'loading' }
  | { postId: string; status: 'not-found' }
  | { entity: PostEntity; postId: string; status: 'ready' }

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Post loading failed. Please try again.'
}

export function PostDetailsPage({ postId }: PostDetailsPageProps) {
  return <PostDetailsPageContent key={postId} postId={postId} />
}

function PostDetailsPageContent({ postId }: PostDetailsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status: sessionStatus, user: sessionUser } = useSession()
  const [postState, setPostState] = useState<PostDetailsState>({ postId, status: 'loading' })
  const [retryVersion, setRetryVersion] = useState(0)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    void post(postId)
      .then((entity) => {
        if (requestIdRef.current !== requestId) {
          return
        }

        if (!entity) {
          setPostState({ postId, status: 'not-found' })
          return
        }

        setPostState({ entity, postId, status: 'ready' })
      })
      .catch((error: unknown) => {
        if (requestIdRef.current === requestId) {
          setPostState({ message: getErrorMessage(error), postId, status: 'error' })
        }
      })

    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1
      }
    }
  }, [postId, retryVersion])

  const currentState: PostDetailsState =
    postState.postId === postId ? postState : { postId, status: 'loading' }

  const closePage = () => {
    router.replace(getSafeReturnToPath(searchParams.get('returnTo')))
  }

  if (currentState.status === 'loading') {
    return (
      <section className={styles.root}>
        <p aria-live="polite" className={styles.status} role="status">
          Loading post...
        </p>
      </section>
    )
  }

  if (currentState.status === 'error') {
    return (
      <section className={styles.root}>
        <PostGrid
          errorMessage={currentState.message}
          isError
          onRetry={() => {
            setPostState({ postId, status: 'loading' })
            setRetryVersion((version) => version + 1)
          }}
        />
      </section>
    )
  }

  if (currentState.status === 'not-found') {
    return (
      <section className={styles.notFound}>
        <h1>Post not found</h1>
        <p>The requested post does not exist or is unavailable.</p>
      </section>
    )
  }

  const displayPost = mapPostEntityToPost(currentState.entity)
  const isOwner =
    sessionStatus === 'authenticated' && sessionUser?.id === currentState.entity.ownerId

  const renderCarousel = () => <PublicPostCarousel media={displayPost.images} />

  return (
    <>
      <Modal
        bodyClassName={styles.body}
        className={styles.modal}
        hideCloseButton
        hideHeader
        modalTitle="Post details"
        onCloseAction={closePage}
        open
      >
        <PostDetails
          author={displayPost.author}
          caption={displayPost.caption}
          createdAt={currentState.entity.createdAt}
          createdAtLabel={formatRelativePostTime(currentState.entity.createdAt)}
          headerAction={
            <>
              {isOwner ? (
                <DeletePostFlow postId={currentState.entity.id}>
                  {({ openDeleteConfirmAction }) => (
                    <EditPostMenu
                      onDeleteAction={openDeleteConfirmAction}
                      onEditAction={() => setIsEditOpen(true)}
                    />
                  )}
                </DeletePostFlow>
              ) : null}
              <IconButton icon={Close} label="Close" onClick={closePage} />
            </>
          }
          media={renderCarousel()}
        />
      </Modal>

      {isOwner && isEditOpen ? (
        <EditPostForm
          author={displayPost.author}
          description={currentState.entity.description ?? ''}
          media={renderCarousel()}
          onCloseAction={() => setIsEditOpen(false)}
          onSavedAction={(entity) => {
            setPostState({ entity, postId, status: 'ready' })
            setIsEditOpen(false)
          }}
          postId={currentState.entity.id}
        />
      ) : null}
    </>
  )
}
