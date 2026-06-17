'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { CreatePostFlow } from '@/features/create-post'
import { Modal } from '@/shared/ui/modal'

import { getSafeCreatePostReturnTo } from './lib/createPostReturnTo'
import styles from './create-post-modal.module.css'

export function CreatePostModal() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const closeModal = () => {
    const returnTo = searchParams.get('returnTo')
    const safeReturnTo = getSafeCreatePostReturnTo(returnTo)

    router.replace(safeReturnTo)
  }

  return (
    <Modal
      bodyClassName={styles.body}
      className={styles.modal}
      hideCloseButton
      hideHeader
      modalTitle="Create post"
      onCloseAction={closeModal}
      open
    >
      <CreatePostFlow onCloseAction={closeModal} />
    </Modal>
  )
}
