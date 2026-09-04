'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ArrowBackIcon, ArrowNextIcon, Dot } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
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

function getPublicationPreviewUrl(image: CreatePostImage | undefined): string | undefined {
  return image?.exported?.objectUrl
}

function getPreviewPlaceholderMessage(
  images: CreatePostImage[],
  messages: {
    noImagesPreview: string
    previewNotReady: string
  },
): string {
  if (images.length === 0) {
    return messages.noImagesPreview
  }

  return messages.previewNotReady
}

function getUploadStatusLabel(
  image: CreatePostImage,
  labels: {
    failed: string
    processing: string
    ready: string
    uploading: string
    waiting: string
  },
): string {
  switch (image.upload?.status) {
    case 'uploading':
      return labels.uploading
    case 'uploaded':
      return labels.processing
    case 'ready':
      return labels.ready
    case 'failed':
      return labels.failed
    default:
      return labels.waiting
  }
}

function getUploadErrorMessage(image: CreatePostImage, uploadFailedSuffix: string): string {
  return image.upload?.error ?? `${image.name} ${uploadFailedSuffix}`
}

export function PublicationStep({
  caption,
  images,
  isPublishing,
  onCaptionChange,
  onRetryUpload,
}: PublicationStepProps) {
  const { t } = useI18n()
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex =
    images.length === 0 ? 0 : Math.min(activeIndex, Math.max(images.length - 1, 0))
  const activeImage = images[safeActiveIndex]
  const activePreviewUrl = getPublicationPreviewUrl(activeImage)
  const failedImages = images.filter((image) => image.upload?.status === 'failed')
  const hasMultipleImages = images.length > 1
  const hasUploadError = failedImages.length > 0
  const isCaptionOverLimit = caption.length > CREATE_POST_CAPTION_MAX_LENGTH
  const captionMaxLengthError = `${t.createPost.publication.maxCharactersPrefix} ${CREATE_POST_CAPTION_MAX_LENGTH}`
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
    <section className={styles.root} aria-label={t.createPost.publication.ariaLabel}>
      <div className={styles.previewPanel}>
        {activePreviewUrl ? (
          <Image
            alt={activeImage?.name ?? t.createPost.publication.previewAlt}
            className={styles.previewImage}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            src={activePreviewUrl}
            unoptimized
          />
        ) : (
          <p className={styles.previewPlaceholder} role="status">
            {getPreviewPlaceholderMessage(images, {
              noImagesPreview: t.createPost.publication.noImagesPreview,
              previewNotReady: t.createPost.publication.previewNotReady,
            })}
          </p>
        )}

        {hasMultipleImages && (
          <>
            <div className={styles.navigationWrapper}>
              <IconButton
                className={styles.navigationItem}
                icon={ArrowBackIcon}
                label={t.createPost.crop.previousImage}
                onClick={handlePrevImage}
              />
              <IconButton
                className={styles.navigationItem}
                icon={ArrowNextIcon}
                label={t.createPost.crop.nextImage}
                onClick={handleNextImage}
              />
            </div>

            <div
              aria-label={t.createPost.publication.imagePagination}
              className={styles.paginationWrapper}
              role="tablist"
            >
              {images.map((image, index) => (
                <IconButton
                  key={image.id}
                  aria-selected={index === safeActiveIndex}
                  className={styles.paginationItem}
                  data-active={index === safeActiveIndex}
                  icon={Dot}
                  label={`${t.createPost.publication.imagePrefix} ${index + 1}`}
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
            disabled={isPublishing}
            error={isCaptionOverLimit ? captionMaxLengthError : null}
            label={t.createPost.publication.captionLabel}
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder={t.createPost.publication.captionPlaceholder}
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
                {isPublishing
                  ? t.createPost.publication.publishing
                  : t.createPost.publication.uploading}
              </Text>
              <div className={styles.progressTrack} aria-hidden>
                <span className={styles.progressIndicator} />
              </div>
            </div>
          )}

          <div className={styles.statusBlock}>
            <Text as="p" className={styles.statusTitle} size="md">
              {t.createPost.publication.uploadStatus}
            </Text>
            <ul className={styles.statusList} aria-label={t.createPost.publication.uploadStatus}>
              {images.map((image) => (
                <li
                  className={styles.statusItem}
                  data-status={image.upload?.status ?? 'idle'}
                  key={image.id}
                >
                  <span className={styles.fileName}>{image.name}</span>
                  <span className={styles.statusValue}>
                    {getUploadStatusLabel(image, t.createPost.publication.statuses)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {hasUploadError && (
            <div className={styles.errorBlock} role="alert">
              <Text as="p" className={styles.errorTitle} size="md">
                {t.createPost.publication.uploadFailed}
              </Text>
              <ul className={styles.errorList}>
                {failedImages.map((image) => (
                  <li key={image.id}>
                    {getUploadErrorMessage(image, t.createPost.publication.uploadFailedSuffix)}
                  </li>
                ))}
              </ul>
              <Button
                className={styles.retryButton}
                disabled={isPublishing}
                onClick={handleRetryUpload}
                type="button"
                variant="outlined"
              >
                {t.createPost.actions.retry}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
