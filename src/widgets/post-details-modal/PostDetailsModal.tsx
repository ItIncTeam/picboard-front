'use client'

import { useI18n } from '@/shared/lib/i18n'
import { Modal } from '@/shared/ui/modal'

import { useClosePostDetailsModal } from './lib/useClosePostDetailsModal'
import type { PostDetailsData } from './model/types'
import { PostDetailsContent } from './PostDetailsContent'
import styles from './post-details-modal.module.css'

type PostDetailsModalProps = {
  data: PostDetailsData
}

export function PostDetailsModal({ data }: PostDetailsModalProps) {
  const closeModal = useClosePostDetailsModal()

  return (
    <PostDetailsContent
      chrome="modal"
      data={data}
      key={data.baselineKey}
      onCloseAction={closeModal}
    />
  )
}

export function PostDetailsUnavailable() {
  const { t } = useI18n()
  const closeModal = useClosePostDetailsModal()

  return (
    <Modal
      bodyClassName={styles.body}
      className={styles.modal}
      hideCloseButton
      hideHeader
      modalTitle={t.widgets.postDetailsModal.title}
      onCloseAction={closeModal}
      open
    >
      <div className={styles.unavailable}>
        <p className={styles.unavailableTitle}>{t.widgets.postDetailsModal.unavailable}</p>
      </div>
    </Modal>
  )
}
