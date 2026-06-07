import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './email-sent-modal.module.css'

type EmailSentModalProps = {
  email: string
  open: boolean
  onClose: () => void
}

export function EmailSentModal({ email, onClose, open }: EmailSentModalProps) {
  return (
    <Modal modalTitle="Email sent" open={open} onClose={onClose}>
      <div className={styles.content}>
        <Text className={styles.message}>We have sent a link to confirm your email to {email}</Text>
        <div className={styles.actions}>
          <Button className={styles.button} onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}
