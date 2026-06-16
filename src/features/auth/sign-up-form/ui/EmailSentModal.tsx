import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './email-sent-modal.module.css'

type EmailSentModalProps = {
  email: string
  open: boolean
  onCloseAction: () => void
}

export function EmailSentModal({ email, onCloseAction, open }: EmailSentModalProps) {
  return (
    <Modal
      className={styles.modal}
      modalTitle="Email sent"
      open={open}
      onCloseAction={onCloseAction}
    >
      <div className={styles.content}>
        <Text className={styles.message}>We have sent a link to confirm your email to {email}</Text>
        <Button className={styles.button} onClick={onCloseAction}>
          OK
        </Button>
      </div>
    </Modal>
  )
}
