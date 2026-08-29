'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useEffect, useRef, useState, type SVGProps } from 'react'

import { IconButton } from '@/shared/ui/icon-button'

import styles from './edit-post-menu.module.css'

type EditPostMenuProps = {
  onEditAction: () => void
}

function PostActionsIcon({
  className,
}: Pick<SVGProps<SVGSVGElement>, 'aria-hidden' | 'className' | 'focusable'>) {
  return <DotsHorizontalIcon aria-hidden className={className} />
}

export function EditPostMenu({ onEditAction }: EditPostMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }

      setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  const handleEdit = () => {
    setIsOpen(false)
    onEditAction()
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <IconButton
        aria-expanded={isOpen}
        aria-haspopup="menu"
        icon={PostActionsIcon}
        label="Post actions"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      />

      {isOpen ? (
        <div className={styles.menu} role="menu">
          <button className={styles.item} onClick={handleEdit} role="menuitem" type="button">
            Edit Post
          </button>
        </div>
      ) : null}
    </div>
  )
}
