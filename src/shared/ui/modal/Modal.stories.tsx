import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/typography'

import { Modal } from './Modal'
import { EmailSentModal } from '@/features/auth/sign-up-form/ui'

const meta = {
  title: 'Shared/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof Modal>

export const Basic: Story = {
  args: {
    modalTitle: 'Modal title',
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
          <EmailSentModal email="vsdb@dsfbdfb.by" open={showModal} onClose={closeModalHandler} />
          {/*<div style={{ width: 378, padding: '24px' }}>*/}
          {/*  <Text mb={24}>Modal content goes here.</Text>*/}
          {/*  <Button onClick={closeModalHandler}>OK</Button>*/}
          {/*</div>*/}
        </Modal>
      </>
    )
  },
}
