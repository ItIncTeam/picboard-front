import * as Dialog from '@radix-ui/react-dialog'
import { Close } from '@/shared/assets'
import styles from './modal.module.css'
import type { ComponentProps } from 'react'
import clsx from 'clsx'

type Props = ComponentProps<'div'> & {
  open: boolean
  onClose: () => void
  modalTitle: string
  className?: string
}

export const Modal = ({ open, onClose, modalTitle, className, ...rest }: Props) => (
  <Dialog.Root open={open} onOpenChange={onClose} {...rest}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={clsx(styles.content, className)}>
        <div className={styles.modalHeader}>
          <Dialog.Title className={styles.Title}> {modalTitle} </Dialog.Title>
          <button type="button" className={styles.IconButton} aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        </div>

        {rest.children}

        <Dialog.Close asChild></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)
