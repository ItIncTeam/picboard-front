'use client'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { useClosePostDetailsModal } from '@/widgets/post-details-modal'

import styles from './error.module.css'
import modalStyles from './error-modal.module.css'

type PostModalRouteErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function PostModalRouteError({ unstable_retry: retry }: PostModalRouteErrorProps) {
  const { t } = useI18n()
  const closeModal = useClosePostDetailsModal()

  return (
    <Modal
      bodyClassName={modalStyles.body}
      className={modalStyles.modal}
      hideCloseButton
      hideHeader
      modalTitle={t.widgets.postDetailsModal.title}
      onCloseAction={closeModal}
      open
    >
      <section className={styles.root} aria-labelledby="post-modal-route-error-title">
        <h1 className={styles.title} id="post-modal-route-error-title">
          {t.appError.title}
        </h1>
        <p className={styles.description}>{t.appError.description}</p>
        <Button onClick={retry} type="button" variant="outlined">
          {t.appError.action}
        </Button>
      </section>
    </Modal>
  )
}
