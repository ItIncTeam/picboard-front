'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { useState } from 'react'

import type { PostImage } from '@/entities/post'
import styles from '../public-post-card.module.css'

type PublicPostCarouselProps = {
  media: PostImage[]
}

export function PublicPostCarousel({ media }: PublicPostCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultipleMedia = media.length > 1
  const safeActiveIndex = Math.min(activeIndex, Math.max(media.length - 1, 0))
  const activeMedia = media[safeActiveIndex]

  if (!activeMedia) {
    return (
      <div className={styles.mediaPlaceholder} role="img" aria-label="Post media unavailable">
        <span>Photo unavailable</span>
      </div>
    )
  }

  const showPrevious = () => {
    setActiveIndex((safeActiveIndex - 1 + media.length) % media.length)
  }

  const showNext = () => {
    setActiveIndex((safeActiveIndex + 1) % media.length)
  }

  return (
    <div className={styles.carousel}>
      <Image
        alt={activeMedia.alt || 'Public post image'}
        className={styles.mediaImage}
        fill
        sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 45vw, 234px"
        src={activeMedia.url}
        unoptimized
      />

      {hasMultipleMedia ? (
        <>
          <button
            aria-label="Show previous image"
            className={`${styles.carouselButton} ${styles.previousButton}`}
            onClick={showPrevious}
            type="button"
          >
            <ChevronLeftIcon aria-hidden />
          </button>
          <button
            aria-label="Show next image"
            className={`${styles.carouselButton} ${styles.nextButton}`}
            onClick={showNext}
            type="button"
          >
            <ChevronRightIcon aria-hidden />
          </button>
          <div className={styles.pagination} aria-label="Choose image">
            {media.map((item, index) => (
              <button
                aria-label={`Show image ${index + 1} of ${media.length}`}
                aria-pressed={index === safeActiveIndex}
                className={styles.paginationDot}
                key={item.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
