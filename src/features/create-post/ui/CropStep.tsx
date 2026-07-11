'use client'

import type { AspectRatio, CreatePostImage } from '@/features/create-post'
import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'

import type { CropperRef } from 'react-advanced-cropper'
import { Cropper } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import styles from './crop-step.module.css'
import { IconButton } from '@/shared/ui'
import {
  AddImage,
  ArrowBackIcon,
  ArrowNextIcon,
  AspectRatioBtn,
  Close,
  Dot,
  ShowSwiper,
} from '@/shared/assets'
import { AspectButtonsBlock } from '@/features/create-post/ui/aspectButtonsBlock/AspectButtonsBlock'
import Image from 'next/image'
import { createCreatePostImageFromFile } from '@/features/create-post/lib/createPostImageFactory'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const
const ACCEPTED_IMAGE_TYPES_INPUT_VALUE = ACCEPTED_IMAGE_TYPES.join(',')
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024
const MAX_IMAGES_COUNT = 10
const MAX_VISIBLE_IMAGES = 3

function getAvailableSlotsMessage(availableSlots: number): string {
  return availableSlots === 1
    ? 'Only 1 more photo can be added.'
    : `Only ${availableSlots} more photos can be added.`
}

export type CropStepProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onSetActiveImage: (imageId: string | null) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onAddImages: (images: CreatePostImage[]) => void
}

export function CropStep({
  activeImage,
  images,
  onSetActiveImage,
  onAspectRatioChange,
  onRemoveImage,
  onImageExported,
  onAddImages,
}: CropStepProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('original')
  const [isVisibleAspectRatio, setIsVisibleAspectRatio] = useState(false)
  const [isVisibleSlider, setIsVisibleSlider] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const hasReachedImagesLimit = images.length >= MAX_IMAGES_COUNT

  const handleSelectFiles = () => {
    if (hasReachedImagesLimit) {
      setErrors([`You can add up to ${MAX_IMAGES_COUNT} photos.`])

      return
    }

    fileInputRef.current?.click()
  }

  const visibleImages = (() => {
    if (images.length <= MAX_VISIBLE_IMAGES) {
      return images
    }

    if (!activeImage?.id) {
      return images.slice(0, MAX_VISIBLE_IMAGES)
    }

    const activeIndex = images.findIndex((image) => image.id === activeImage.id)

    if (activeIndex === 0) {
      return images.slice(0, MAX_VISIBLE_IMAGES)
    }

    if (activeIndex === images.length - 1) {
      return images.slice(activeIndex - 2)
    }

    return images.slice(activeIndex - 1, activeIndex + 2)
  })()

  console.log(visibleImages)

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

    const nextImages = validFiles.map(createCreatePostImageFromFile)

    onAddImages(nextImages)
    setErrors(nextErrors)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFiles(Array.from(event.currentTarget.files ?? []))
    event.currentTarget.value = ''
  }

  const handleRemoveImage = (image: CreatePostImage) => {
    const currentIndex = images.findIndex((item) => item.id === image.id)
    const nextImages = images.filter((item) => item.id !== image.id)

    onRemoveImage(image.id)

    if (nextImages.length === 0) {
      onSetActiveImage(null)
      return
    }

    const nextIndex = (() => {
      if (currentIndex === -1) {
        return 0
      }

      if (currentIndex >= nextImages.length) {
        return nextImages.length - 1
      }

      return currentIndex
    })()

    onSetActiveImage(nextImages[nextIndex].id)
  }

  const ASPECT_RATIOS: Record<AspectRatio, number | undefined> = {
    original: undefined,
    '1:1': 1,
    '4:5': 4 / 5,
    '16:9': 16 / 9,
  }

  const handleRatioSelect = (ratio: AspectRatio) => {
    setSelectedRatio(ratio)
  }

  const handleNextImage = () => {
    if (!activeImage?.id || images.length <= 1) return

    const currentIndex = images.findIndex((image) => image.id === activeImage.id)
    if (currentIndex === -1) return

    const nextIndex = (currentIndex + 1) % images.length
    onSetActiveImage(images[nextIndex].id)
  }

  const handlePrevImage = () => {
    if (!activeImage?.id || images.length <= 1) return

    const currentIndex = images.findIndex((image) => image.id === activeImage.id)
    if (currentIndex === -1) return

    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    onSetActiveImage(images[prevIndex].id)
  }

  const handleVisibleAspectRatioChange = () => {
    if (isVisibleAspectRatio) {
      handleCrop(selectedRatio)
    } else {
      setIsVisibleSlider(false)
      setIsVisibleAspectRatio(true)
    }
  }

  const handleVisibleSliderChange = () => {
    if (isVisibleSlider) {
      setIsVisibleSlider(false)
    } else {
      setIsVisibleAspectRatio(false)
      setIsVisibleSlider(true)
    }
  }

  const cropperRef = useRef<CropperRef>(null)

  const handleCrop = async (ratio: AspectRatio = selectedRatio) => {
    setIsVisibleAspectRatio(false)

    if (!activeImage?.id || !cropperRef.current) return

    const canvas = cropperRef.current.getCanvas()
    if (!canvas) return

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })

    if (!blob) return

    const fileName = activeImage.file?.name ?? activeImage.name ?? 'cropped-image.jpg'
    const file = new File([blob], fileName, {
      type: blob.type || activeImage.fileInfo?.type || 'image/jpeg',
      lastModified: Date.now(),
    })

    const exported: NonNullable<CreatePostImage['exported']> = {
      objectUrl: URL.createObjectURL(blob),
      file,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    }

    onAspectRatioChange(activeImage.id, ratio)
    onImageExported(activeImage.id, exported)
  }

  return (
    <div style={{ width: '492px' }}>
      <Cropper
        ref={cropperRef}
        src={activeImage?.exported?.objectUrl || activeImage?.previewUrl}
        className={styles.activePreviewImage}
        stencilProps={{
          aspectRatio: ASPECT_RATIOS[selectedRatio],
        }}
      />
      {isVisibleAspectRatio && (
        <AspectButtonsBlock onSelectRatio={handleRatioSelect} selectedRatio={selectedRatio} />
      )}
      <IconButton
        onClick={handleVisibleAspectRatioChange}
        className={styles.aspectRatioButton}
        icon={AspectRatioBtn}
        label="AspectRatio"
        data-active={isVisibleAspectRatio}
      />

      <IconButton
        onClick={handleVisibleSliderChange}
        className={styles.showSwiper}
        icon={ShowSwiper}
        label="showSwiper"
        data-active={isVisibleSlider}
      />

      {isVisibleSlider && (
        <>
          <input
            ref={fileInputRef}
            accept={ACCEPTED_IMAGE_TYPES_INPUT_VALUE}
            className={styles.fileInput}
            multiple
            onChange={handleFileChange}
            type="file"
          />
          <div className={styles.swiper} aria-label="Selected images">
            {visibleImages?.map((image) => {
              const imageSrc = image.exported?.objectUrl || image.previewUrl
              const isActive = image.id === activeImage?.id

              return (
                <div
                  key={image.id}
                  role="button"
                  className={styles.swiperItem}
                  data-active={isActive}
                  onClick={() => onSetActiveImage(image.id)}
                >
                  {imageSrc ? (
                    <>
                      <Image
                        className={styles.swiperImage}
                        src={imageSrc}
                        alt={image.name}
                        unoptimized // Важно! Отключает серверную оптимизацию для Blob
                        width={50} // Укажите примерную ширину миниатюры в пикселях
                        height={50} // Укажите примерную высоту миниатюры в пикселях
                      />
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation()
                          handleRemoveImage(image)
                        }}
                        className={styles.deleteImage}
                        icon={Close}
                        label="deleteImage"
                      />
                    </>
                  ) : (
                    <span className={styles.swiperPlaceholder}>{image.name}</span>
                  )}
                </div>
              )
            })}
            <div className={styles.wrapperAddImage}>
              <IconButton
                className={styles.addImage}
                icon={AddImage}
                label="AddImage"
                disabled={hasReachedImagesLimit}
                onClick={handleSelectFiles}
              />
            </div>
          </div>

          <div className={styles.paginationWrapper} aria-label="Pagination item">
            {images.map((image) => {
              const isActive = image.id === activeImage?.id

              return (
                <IconButton
                  key={image.id}
                  icon={Dot}
                  className={styles.paginationItem}
                  label="Dot"
                  data-active={isActive}
                />
              )
            })}
          </div>
          {errors.length > 0 && (
            <ul className={styles.errors} aria-live="polite">
              {errors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className={styles.navigationWrapper}>
        <IconButton
          className={styles.navigationItem}
          icon={ArrowBackIcon}
          label={'ArrowBackIcon'}
          onClick={handlePrevImage}
          disabled={images.length <= 1}
        />
        <IconButton
          className={styles.navigationItem}
          icon={ArrowNextIcon}
          label={'ArrowNextIcon'}
          onClick={handleNextImage}
          disabled={images.length <= 1}
        />
      </div>
    </div>
  )
}
