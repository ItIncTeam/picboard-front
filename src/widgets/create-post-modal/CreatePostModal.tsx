'use client'

import { useRouter } from 'next/navigation'

import { CreatePostFlow } from '@/features/create-post'
import { Modal } from '@/shared/ui/modal'

import styles from './create-post-modal.module.css'

const fallbackRoute = '/main'

export function CreatePostModal() {
  const router = useRouter()

  const closeModal = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.replace(fallbackRoute)
  }

  return (
    <Modal className={styles.modal} modalTitle="Create post" onCloseAction={closeModal} open>
      <CreatePostFlow />
    </Modal>
  )
}
