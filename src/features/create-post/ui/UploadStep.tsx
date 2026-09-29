'use client'

import Image from 'next/image'
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'

import { Close } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Text } from '@/shared/ui/typography'

import type { CreatePostImage } from '@/features/create-post'
import { createCreatePostImageFromFile } from '../lib/createPostImageFactory'
import styles from './upload-step.module.css'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const
const ACCEPTED_IMAGE_TYPES_INPUT_VALUE = ACCEPTED_IMAGE_TYPES.join(',')
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024
const MAX_IMAGES_COUNT = 10

export type UploadStepProps = {
  activeImageId: string | null
  images: CreatePostImage[]
  onAddImages: (images: CreatePostImage[]) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

export function UploadStep({
  activeImageId,
  images,
  onAddImages,
  onRemoveImage,
  onSetActiveImage,
}: UploadStepProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0] ?? null
  const hasReachedImagesLimit = images.length >= MAX_IMAGES_COUNT

  const handleSelectFiles = () => {
    if (hasReachedImagesLimit) {
      setErrors([t.createPost.upload.imageLimit])

      return
    }

    fileInputRef.current?.click()
  }

  const handleRemoveImage = (image: CreatePostImage) => {
    onRemoveImage(image.id)
  }

  const handleSelectedFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return
    }

    const availableSlots = MAX_IMAGES_COUNT - images.length
    const nextErrors: string[] = []

    if (availableSlots <= 0) {
      setErrors([t.createPost.upload.imageLimit])

      return
    }

    if (selectedFiles.length > availableSlots) {
      nextErrors.push(
        availableSlots === 1
          ? t.createPost.upload.oneMorePhoto
          : `${t.createPost.upload.morePhotosPrefix} ${availableSlots} ${t.createPost.upload.morePhotosSuffix}`,
      )
    }

    const filesForValidation = selectedFiles.slice(0, Math.max(availableSlots, 0))
    const validFiles = filesForValidation.filter((file) => {
      const hasAcceptedType = ACCEPTED_IMAGE_TYPES.some((imageType) => imageType === file.type)

      if (!hasAcceptedType) {
        nextErrors.push(`${file.name} ${t.createPost.upload.unsupportedTypeSuffix}`)

        return false
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        nextErrors.push(`${file.name} ${t.createPost.upload.maxSizeSuffix}`)

        return false
      }

      return true
    })

    if (validFiles.length === 0) {
      setErrors(nextErrors)

      return
    }

    const nextImages = validFiles.map(createCreatePostImageFromFile)

    onAddImages(nextImages)
    setErrors(nextErrors)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFiles(Array.from(event.currentTarget.files ?? []))
    event.currentTarget.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    handleSelectedFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <section
      className={styles.root}
      aria-label={t.createPost.upload.ariaLabel}
      data-has-images={images.length > 0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        accept={ACCEPTED_IMAGE_TYPES_INPUT_VALUE}
        className={styles.fileInput}
        multiple
        onChange={handleFileChange}
        type="file"
      />

      <div className={styles.previewPanel}>
        {images.length > 0 && (
          <Text as="p" className={styles.sectionLabel} size="sm">
            {t.createPost.upload.selectedPhoto}
          </Text>
        )}

        {activeImage?.previewUrl ? (
          <div className={styles.placeholder}>
            <Image
              alt={activeImage.name}
              className={styles.activePreviewImage}
              fill
              sizes="min(100vw, 288px)"
              src={activeImage.previewUrl}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
        ) : (
          <div className={styles.placeholder} aria-hidden>
            <div className={styles.icon}>
              <span className={styles.iconSky} />
              <span className={styles.iconSun} />
              <span className={styles.iconMountainPrimary} />
              <span className={styles.iconMountainSecondary} />
            </div>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className={styles.gallery}>
          <div className={styles.galleryHeader}>
            <Text as="p" className={styles.sectionLabel} size="sm">
              {t.createPost.upload.selectedPhotos}
            </Text>
            <Text as="p" className={styles.counter} size="sm">
              {images.length === 1
                ? t.createPost.upload.onePhotoSelected
                : `${images.length} ${t.createPost.upload.photosSelectedSuffix}`}
            </Text>
          </div>

          <ul className={styles.previewList} aria-label={t.createPost.upload.selectedPhotos}>
            {images.map((image, index) => {
              const isActive = image.id === activeImage?.id

              return (
                <li key={image.id} className={styles.previewItem} data-active={isActive}>
                  <button
                    aria-label={`${t.createPost.upload.selectImagePrefix} ${index + 1}: ${image.name}`}
                    aria-pressed={isActive}
                    className={styles.previewButton}
                    onClick={() => onSetActiveImage(image.id)}
                    type="button"
                  >
                    {image.previewUrl && (
                      <Image
                        alt={image.name}
                        className={styles.previewImage}
                        fill
                        sizes="64px"
                        src={image.previewUrl}
                        unoptimized
                      />
                    )}
                  </button>
                  <IconButton
                    className={styles.removeButton}
                    icon={Close}
                    label={`${t.createPost.upload.removePrefix} ${image.name}`}
                    onClick={() => handleRemoveImage(image)}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className={styles.content}>
        <Text as="p" className={styles.caption} size="md">
          {t.createPost.upload.addPhotosCaption}
        </Text>
        <Button
          className={styles.button}
          disabled={hasReachedImagesLimit}
          onClick={handleSelectFiles}
          type="button"
        >
          {t.createPost.actions.selectFromComputer}
        </Button>

        {errors.length > 0 && (
          <ul className={styles.errors} aria-live="polite">
            {errors.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
