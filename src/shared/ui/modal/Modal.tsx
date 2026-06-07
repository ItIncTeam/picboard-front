import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import type { ReactNode } from 'react'

import { Close } from '@/shared/assets'

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
          <div className={styles.modalHeader}>
            <Dialog.Title className={styles.title}>{modalTitle}</Dialog.Title>
            <Dialog.Close className={styles.closeButton} aria-label="Close">
              <Close aria-hidden className={styles.closeIcon} />
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
