'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

import { ArrowBackIcon } from '@/shared/assets'
import { Title } from '@/shared/ui/typography'

import styles from './doc-modal.module.css'
import { docModalConfig, type DocModalKind } from './model/docModalConfig'
import { renderDocBody } from './model/renderDocBody'

type DocModalProps = {
  kind: DocModalKind
  onCloseAction: () => void
}

export function DocModal({ kind, onCloseAction }: DocModalProps) {
  const titleId = useId()
  const { title } = docModalConfig[kind]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseAction()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCloseAction])

  return createPortal(
    <div className={styles.overlay} onClick={onCloseAction} role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.panel}
        role="dialog"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <button autoFocus className={styles.backLink} onClick={onCloseAction} type="button">
          <ArrowBackIcon aria-hidden className={styles.backIcon} />
          <span className={styles.backLabel}>Back to Sign Up</span>
        </button>

        <div className={styles.docColumn}>
          <Title className={styles.title} id={titleId} level="h1">
            {title}
          </Title>

          <div className={styles.body}>{renderDocBody(kind)}</div>
        </div>
      </section>
    </div>,
    document.body,
  )
}
