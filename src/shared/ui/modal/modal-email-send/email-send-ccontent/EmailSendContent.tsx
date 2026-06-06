import React from 'react'
import s from '@/shared/ui/modal/modal-email-send/email-send-ccontent/EmailSendContent.module.css'
import { Text } from '@/shared/ui'
import { Button } from '@/shared/ui/button'

type Props = {
  onClose: () => void
}

export const EmailSendContent = ({ onClose }: Props) => {
  return (
    <div className={s.wrapper}>
      <Text mt={30} mx={24} mb={18}>
        We have sent a link to confirm your email to epam@epam.com
      </Text>
      <div className={s.buttonWrapper}>
        <Button className={s.button} onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  )
}
