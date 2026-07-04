'use client'

import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'

import { Close } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Text } from '@/shared/ui/typography'

import type { CreatePostImage } from '@/features/create-post'
import styles from './upload-step.module.css'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const
const ACCEPTED_IMAGE_TYPES_INPUT_VALUE = ACCEPTED_IMAGE_TYPES.join(',')
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024
const MAX_IMAGES_COUNT = 10

function getAvailableSlotsMessage(availableSlots: number): string {
  return availableSlots === 1
    ? 'Only 1 more photo can be added.'
    : `Only ${availableSlots} more photos can be added.`
}

function createPostImageFromFile(file: File): CreatePostImage {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    file,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
    previewUrl: URL.createObjectURL(file),
    aspectRatio: 'original',
    filter: 'normal',
  }
}

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0] ?? null
  const hasReachedImagesLimit = images.length >= MAX_IMAGES_COUNT

  const handleSelectFiles = () => {
    if (hasReachedImagesLimit) {
      setErrors([`You can add up to ${MAX_IMAGES_COUNT} photos.`])

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
      setErrors([`You can add up to ${MAX_IMAGES_COUNT} photos.`])

      return
    }

    if (selectedFiles.length > availableSlots) {
      nextErrors.push(getAvailableSlotsMessage(availableSlots))
    }

    const filesForValidation = selectedFiles.slice(0, Math.max(availableSlots, 0))
    const validFiles = filesForValidation.filter((file) => {
      const hasAcceptedType = ACCEPTED_IMAGE_TYPES.some((imageType) => imageType === file.type)

      if (!hasAcceptedType) {
        nextErrors.push(`${file.name} must be JPEG or PNG.`)

        return false
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        nextErrors.push(`${file.name} must be 20 MB or smaller.`)

        return false
      }

      return true
    })

    if (validFiles.length === 0) {
      setErrors(nextErrors)

      return
    }

    const nextImages = validFiles.map(createPostImageFromFile)

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
      aria-label="Upload photo"
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

      {activeImage?.previewUrl ? (
        <div className={styles.placeholder}>
          <img
            className={styles.activePreviewImage}
            src={activeImage.previewUrl}
            alt={activeImage.name}
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

      {images.length > 0 && (
        <ul className={styles.previewList} aria-label="Selected photos">
          {images.map((image) => (
            <li key={image.id} className={styles.previewItem}>
              <button
                aria-label={`Select ${image.name}`}
                className={styles.previewButton}
                data-active={image.id === activeImageId}
                onClick={() => onSetActiveImage(image.id)}
                type="button"
              >
                {image.previewUrl && (
                  <img className={styles.previewImage} src={image.previewUrl} alt={image.name} />
                )}
              </button>
              <IconButton
                className={styles.removeButton}
                icon={Close}
                label={`Remove ${image.name}`}
                onClick={() => handleRemoveImage(image)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.content}>
        <Text as="p" className={styles.caption} size="md">
          Add photos for your new publication
        </Text>
        <Button
          className={styles.button}
          disabled={hasReachedImagesLimit}
          onClick={handleSelectFiles}
          type="button"
        >
          Select from Computer
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
