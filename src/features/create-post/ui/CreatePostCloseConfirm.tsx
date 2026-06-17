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
  return (
    <Modal
      className={styles.modal}
      modalTitle="Close publication creation"
      onCloseAction={onKeepEditingAction}
      open={open}
    >
      <div className={styles.content}>
        <Text>
          Do you really want to close the creation of a publication? If you close everything will be
          deleted.
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
