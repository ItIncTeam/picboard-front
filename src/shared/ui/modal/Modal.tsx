import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import type { ReactNode } from 'react'

import { Close } from '@/shared/assets'
import { IconButton } from '@/shared/ui/icon-button'

import styles from './modal.module.css'

type ModalProps = {
  children: ReactNode
  bodyClassName?: string
  className?: string
  hideCloseButton?: boolean
  hideHeader?: boolean
  open: boolean
  onCloseAction: () => void
  modalTitle: string
}

export function Modal({
  bodyClassName,
  children,
  className,
  hideCloseButton = false,
  hideHeader = false,
  modalTitle,
  onCloseAction,
  open,
}: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCloseAction()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={clsx(styles.content, className)}>
          {!hideCloseButton && (
            <Dialog.Close asChild>
              <IconButton className={styles.closeButton} icon={Close} label="Close" />
            </Dialog.Close>
          )}

          {hideHeader ? (
            <Dialog.Title className={styles.visuallyHidden}>{modalTitle}</Dialog.Title>
          ) : (
            <div className={styles.modalHeader}>
              <Dialog.Title className={styles.title}>{modalTitle}</Dialog.Title>
            </div>
          )}

          <div className={clsx(styles.body, bodyClassName)}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
