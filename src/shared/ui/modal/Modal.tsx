import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import type { ReactNode } from 'react'

import { Close } from '@/shared/assets'
import { IconButton } from '@/shared/ui/icon-button'

import styles from './modal.module.css'

type ModalProps = {
  children: ReactNode
  className?: string
  open: boolean
  onClose: () => void
  modalTitle: string
}

export function Modal({ children, className, modalTitle, onClose, open }: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={clsx(styles.content, className)}>
          <Dialog.Close asChild>
            <IconButton className={styles.closeButton} icon={Close} label="Close" />
          </Dialog.Close>

          <div className={styles.modalHeader}>
            <Dialog.Title className={styles.title}>{modalTitle}</Dialog.Title>
          </div>

          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
