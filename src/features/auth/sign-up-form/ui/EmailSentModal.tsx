'use client'

import { Button } from '@/shared/ui/button'
import { useI18n } from '@/shared/lib/i18n'
import { Modal } from '@/shared/ui/modal'
import { Text } from '@/shared/ui/typography'

import styles from './email-sent-modal.module.css'

type EmailSentModalProps = {
  email: string
  open: boolean
  onCloseAction: () => void
}

export function EmailSentModal({ email, onCloseAction, open }: EmailSentModalProps) {
  const { t } = useI18n()

  return (
    <Modal
      className={styles.modal}
      modalTitle={t.auth.signUp.emailSentTitle}
      open={open}
      onCloseAction={onCloseAction}
    >
      <div className={styles.content}>
        <Text className={styles.message}>
          {t.auth.signUp.emailSentMessagePrefix} {email}
        </Text>
        <Button className={styles.button} onClick={onCloseAction}>
          {t.ui.ok}
        </Button>
      </div>
    </Modal>
  )
}
