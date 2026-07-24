'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ArrowBackIcon, ArrowNextIcon, Dot } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { TextArea } from '@/shared/ui/text-area/TextArea'
import { Text } from '@/shared/ui/typography'

import type { CreatePostImage } from '@/features/create-post'
import { CREATE_POST_CAPTION_MAX_LENGTH } from '../lib/createPostConstants'
import styles from './publication-step.module.css'

export type PublicationStepProps = {
  caption: string
  images: CreatePostImage[]
  isPublishing: boolean
  onCaptionChange: (caption: string) => void
  onRetryUpload: () => void
}

const CAPTION_MAX_LENGTH_ERROR = `Maximum number of characters ${CREATE_POST_CAPTION_MAX_LENGTH}`
const EXPORT_PREVIEW_NOT_READY_MESSAGE = 'Final preview is not ready'
const NO_IMAGES_PREVIEW_MESSAGE = 'Add and export images to preview publication.'

function getPublicationPreviewUrl(image: CreatePostImage | undefined): string | undefined {
  return image?.exported?.objectUrl
}

function getPreviewPlaceholderMessage(images: CreatePostImage[]): string {
  if (images.length === 0) {
    return NO_IMAGES_PREVIEW_MESSAGE
  }

  return EXPORT_PREVIEW_NOT_READY_MESSAGE
}

function getUploadStatusLabel(image: CreatePostImage): string {
  switch (image.upload?.status) {
    case 'uploading':
      return 'Uploading'
    case 'uploaded':
      return 'Processing'
    case 'ready':
      return 'Ready'
    case 'failed':
      return 'Failed'
    default:
      return 'Waiting'
  }
}

function getUploadErrorMessage(image: CreatePostImage): string {
  return image.upload?.error ?? `${image.name} upload failed.`
}

export function PublicationStep({
  caption,
  images,
  isPublishing,
  onCaptionChange,
  onRetryUpload,
}: PublicationStepProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex =
    images.length === 0 ? 0 : Math.min(activeIndex, Math.max(images.length - 1, 0))
  const activeImage = images[safeActiveIndex]
  const activePreviewUrl = getPublicationPreviewUrl(activeImage)
  const failedImages = images.filter((image) => image.upload?.status === 'failed')
  const hasMultipleImages = images.length > 1
  const hasUploadError = failedImages.length > 0
  const isCaptionOverLimit = caption.length > CREATE_POST_CAPTION_MAX_LENGTH
  const isUploading = images.some((image) => image.upload?.status === 'uploading')
  const showProgress = isPublishing || isUploading

  const handlePrevImage = () => {
    if (!hasMultipleImages) {
      return
    }

    setActiveIndex((currentIndex) => (currentIndex === 0 ? images.length - 1 : currentIndex - 1))
  }

  const handleNextImage = () => {
    if (!hasMultipleImages) {
      return
    }

    setActiveIndex((currentIndex) => (currentIndex + 1) % images.length)
  }

  const handleRetryUpload = () => {
    if (isPublishing) {
      return
    }

    onRetryUpload()
  }

  return (
    <section className={styles.root} aria-label="Publication">
      <div className={styles.previewPanel}>
        {activePreviewUrl ? (
          <Image
            alt={activeImage?.name ?? 'Publication preview'}
            className={styles.previewImage}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            src={activePreviewUrl}
            unoptimized
          />
        ) : (
          <p className={styles.previewPlaceholder} role="status">
            {getPreviewPlaceholderMessage(images)}
          </p>
        )}

        {hasMultipleImages && (
          <>
            <div className={styles.navigationWrapper}>
              <IconButton
                className={styles.navigationItem}
                icon={ArrowBackIcon}
                label="Previous image"
                onClick={handlePrevImage}
              />
              <IconButton
                className={styles.navigationItem}
                icon={ArrowNextIcon}
                label="Next image"
                onClick={handleNextImage}
              />
            </div>

            <div aria-label="Image pagination" className={styles.paginationWrapper} role="tablist">
              {images.map((image, index) => (
                <IconButton
                  key={image.id}
                  aria-selected={index === safeActiveIndex}
                  className={styles.paginationItem}
                  data-active={index === safeActiveIndex}
                  icon={Dot}
                  label={`Image ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  role="tab"
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.formPanel}>
        <div className={styles.descriptionField}>
          <TextArea
            className={styles.textArea}
            classNameLabel={styles.descriptionLabel}
            error={isCaptionOverLimit ? CAPTION_MAX_LENGTH_ERROR : null}
            label="Add publication descriptions"
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder="Text-area"
            value={caption}
          />
          <span aria-live="polite" className={styles.counter} data-over-limit={isCaptionOverLimit}>
            {caption.length}/{CREATE_POST_CAPTION_MAX_LENGTH}
          </span>
        </div>

        <div className={styles.detailsPane}>
          {showProgress && (
            <div className={styles.progress} aria-live="polite">
              <Text as="p" className={styles.progressText} size="sm">
                {isPublishing ? 'Publishing...' : 'Uploading...'}
              </Text>
              <div className={styles.progressTrack} aria-hidden>
                <span className={styles.progressIndicator} />
              </div>
            </div>
          )}

          <div className={styles.statusBlock}>
            <Text as="p" className={styles.statusTitle} size="md">
              Upload status
            </Text>
            <ul className={styles.statusList} aria-label="Upload status">
              {images.map((image) => (
                <li
                  className={styles.statusItem}
                  data-status={image.upload?.status ?? 'idle'}
                  key={image.id}
                >
                  <span className={styles.fileName}>{image.name}</span>
                  <span className={styles.statusValue}>{getUploadStatusLabel(image)}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasUploadError && (
            <div className={styles.errorBlock} role="alert">
              <Text as="p" className={styles.errorTitle} size="md">
                Upload failed. Please try again.
              </Text>
              <ul className={styles.errorList}>
                {failedImages.map((image) => (
                  <li key={image.id}>{getUploadErrorMessage(image)}</li>
                ))}
              </ul>
              <Button
                className={styles.retryButton}
                disabled={isPublishing}
                onClick={handleRetryUpload}
                type="button"
                variant="outlined"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
