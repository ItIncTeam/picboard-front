'use client'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './create-post-close-confirm.module.css'

type CreatePostCloseConfirmProps = {
  open: boolean
  onDiscardAction: () => void
  onKeepEditingAction: () => void
}

export function CreatePostCloseConfirm({
  open,
  onDiscardAction,
  onKeepEditingAction,
}: CreatePostCloseConfirmProps) {
  const { t } = useI18n()

  return (
    <Modal
      className={styles.modal}
      modalTitle={t.createPost.closeConfirm.title}
      onCloseAction={onKeepEditingAction}
      open={open}
    >
      <div className={styles.content}>
        <Text>{t.createPost.closeConfirm.description}</Text>

        <div className={styles.actions}>
          <Button type="button" variant="textButton" onClick={onDiscardAction}>
            {t.createPost.actions.discard}
          </Button>

          <Button type="button" onClick={onKeepEditingAction}>
            {t.createPost.actions.keepEditing}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
