import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './edit-post-close-confirm.module.css'

type EditPostCloseConfirmProps = {
  onDiscardAction: () => void
  onKeepEditingAction: () => void
  open: boolean
}

export function EditPostCloseConfirm({
  onDiscardAction,
  onKeepEditingAction,
  open,
}: EditPostCloseConfirmProps) {
  return (
    <Modal
      className={styles.modal}
      modalTitle="Close posting editor"
      onCloseAction={onKeepEditingAction}
      open={open}
    >
      <div className={styles.content}>
        <Text>
          Do you really want to close editing of the publication? If you close, your changes will
          not be saved.
        </Text>

        <div className={styles.actions}>
          <Button type="button" variant="textButton" onClick={onDiscardAction}>
            Discard
          </Button>

          <Button type="button" onClick={onKeepEditingAction}>
            Keep editing
          </Button>
        </div>
      </div>
    </Modal>
  )
}
