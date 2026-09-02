'use client'

import { useState } from 'react'

import { useI18n } from '@/shared/lib/i18n'
import styles from '../public-post-card.module.css'

type PublicPostDescriptionProps = {
  description: string
}

const COLLAPSED_DESCRIPTION_LENGTH = 90

export function PublicPostDescription({ description }: PublicPostDescriptionProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const canExpand = description.length > COLLAPSED_DESCRIPTION_LENGTH
  const visibleDescription =
    canExpand && !isExpanded
      ? `${description.slice(0, COLLAPSED_DESCRIPTION_LENGTH).trimEnd()}…`
      : description

  if (!description) {
    return null
  }

  return (
    <p className={styles.description}>
      <span>{visibleDescription}</span>{' '}
      {canExpand ? (
        <button
          aria-expanded={isExpanded}
          className={styles.descriptionButton}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          type="button"
        >
          {isExpanded ? t.widgets.publicPostCard.hide : t.widgets.publicPostCard.showMore}
        </button>
      ) : null}
    </p>
  )
}
