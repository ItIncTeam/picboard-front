'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

import { CreatePostFlow, type CreatePostFlowHandle } from '@/features/create-post/ui/CreatePostFlow'
import { useI18n } from '@/shared/lib/i18n'
import { Modal } from '@/shared/ui/modal'

import { getSafeCreatePostReturnTo } from './lib/createPostReturnTo'
import styles from './create-post-modal.module.css'

export function CreatePostModal() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const flowRef = useRef<CreatePostFlowHandle>(null)

  const closeModal = () => {
    const returnTo = searchParams.get('returnTo')
    const safeReturnTo = getSafeCreatePostReturnTo(returnTo)

    router.replace(safeReturnTo)
  }

  const requestClose = () => {
    flowRef.current?.requestClose()
  }

  return (
    <Modal
      bodyClassName={styles.body}
      className={styles.modal}
      hideCloseButton
      hideHeader
      modalTitle={t.widgets.createPostModal.title}
      onCloseAction={requestClose}
      open
    >
      <CreatePostFlow closeRequestRef={flowRef} onCloseAction={closeModal} />
    </Modal>
  )
}
