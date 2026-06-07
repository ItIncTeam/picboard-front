import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Modal } from '@/shared/ui/modal/Modal'
import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { ModalEmailSent } from '@/shared/ui/modal/modal-email-send/Modal-email-sent'

const meta = {
  title: 'Shared/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof Modal>

// open: boolean
// onClose: () => void
//   modalTitle: string
// className?: string

export const EmailSendModal: Story = {
  args: {
    modalTitle: 'Email sent',
  },
  render: (args) => {
    const [showModal, setShowModal] = useState(false)

    const openModalHandler = () => {
      setShowModal(true)
    }

    const closeModalHandler = () => {
      setShowModal(false)
    }

    return (
      <>
        <Button onClick={openModalHandler}>Open modal</Button>
        <Modal {...args} open={showModal} onClose={closeModalHandler}>
          <ModalEmailSent open={showModal} onClose={closeModalHandler} />
        </Modal>
      </>
    )
  },
}
