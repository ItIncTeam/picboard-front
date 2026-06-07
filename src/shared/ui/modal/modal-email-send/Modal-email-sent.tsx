import { Modal } from '@/shared/ui/modal'
import { EmailSendContent } from '@/shared/ui/modal/modal-email-send/email-send-ccontent/EmailSendContent'

type Props = {
  open: boolean
  onClose: () => void
}

export const ModalEmailSent = ({ open, onClose }: Props) => {
  return (
    <Modal modalTitle={'Email sent'} open={open} onClose={onClose}>
      <EmailSendContent onClose={onClose} />
    </Modal>
  )
}
