'use client'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'

import styles from './avatar-delete-confirm.module.css'

type AvatarDeleteConfirmProps = {
  errorMessage: string | null
  isDeleting: boolean
  onCloseAction: () => void
  onConfirmAction: () => void
  open: boolean
}

export function AvatarDeleteConfirm({
  errorMessage,
  isDeleting,
  onCloseAction,
  onConfirmAction,
  open,
}: AvatarDeleteConfirmProps) {
  const { t } = useI18n()

  return (
    <Modal
      className={styles.modal}
      hideCloseButton={isDeleting}
      modalTitle={t.profile.avatar.deleteTitle}
      onCloseAction={onCloseAction}
      open={open}
    >
      <div className={styles.content}>
        <p>{t.profile.avatar.deleteDescription}</p>

        {errorMessage ? <p role="alert">{errorMessage}</p> : null}

        <div className={styles.actions}>
          <Button disabled={isDeleting} onClick={onCloseAction} type="button" variant="textButton">
            {t.profile.avatar.no}
          </Button>
          <Button
            loading={isDeleting}
            loadingText={t.profile.avatar.deleting}
            onClick={onConfirmAction}
            type="button"
          >
            {t.profile.avatar.yes}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
