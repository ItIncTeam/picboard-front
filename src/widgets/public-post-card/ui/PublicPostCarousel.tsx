'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { useState } from 'react'

import type { PostImage } from '@/entities/post'
import styles from '../public-post-card.module.css'

type PublicPostCarouselFit = 'contain' | 'cover'

type PublicPostCarouselProps = {
  fit?: PublicPostCarouselFit
  media: PostImage[]
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
}

const THUMBNAIL_IMAGE_SIZES =
  '(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 45vw, 234px'
const DETAILS_IMAGE_SIZES = '(max-width: 720px) 100vw, 50vw'

export function PublicPostCarousel({
  activeIndex: activeIndexProp,
  fit = 'cover',
  media,
  onActiveIndexChange,
}: PublicPostCarouselProps) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0)
  const lastIndex = Math.max(media.length - 1, 0)
  const requestedIndex = onActiveIndexChange ? (activeIndexProp ?? 0) : uncontrolledIndex
  const safeActiveIndex = Math.min(Math.max(requestedIndex, 0), lastIndex)
  const activeMedia = media[safeActiveIndex]
  const hasMultipleMedia = media.length > 1

  const setActiveIndex = (index: number) => {
    if (onActiveIndexChange) {
      onActiveIndexChange(index)
      return
    }

    setUncontrolledIndex(index)
  }

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
    <div className={styles.carousel} data-fit={fit}>
      <Image
        alt={activeMedia.alt || 'Public post image'}
        className={styles.mediaImage}
        fill
        sizes={fit === 'contain' ? DETAILS_IMAGE_SIZES : THUMBNAIL_IMAGE_SIZES}
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
