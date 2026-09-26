'use client'

import type {
  AspectRatio,
  CreatePostCropGeometry,
  CreatePostImage,
  CreatePostImageArtifact,
} from '@/features/create-post'
import type { ChangeEvent, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { CropperRef } from 'react-advanced-cropper'
import { Cropper } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import styles from './crop-step.module.css'
import { IconButton } from '@/shared/ui'
import { useI18n } from '@/shared/lib/i18n'
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

export type CropStepProps = {
  activeImage: CreatePostImage | null
  disabled?: boolean
  exportRef?: Ref<CropStepHandle>
  images: CreatePostImage[]
  onSetActiveImage: (imageId: string | null) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCropGeometryChange: (imageId: string, geometry: CreatePostCropGeometry) => void
  onRemoveImage: (imageId: string) => void
  onAddImages: (images: CreatePostImage[]) => void
}

export type CropExportResult = {
  cropped: CreatePostImageArtifact
  geometry: CreatePostCropGeometry
  imageId: string
  ratio: AspectRatio
}

export type CropStepHandle = {
  exportActiveImage: () => Promise<CropExportResult>
}

export class CropExportCancelledError extends Error {
  constructor() {
    super('Crop export was cancelled because the active image changed.')
    this.name = 'CropExportCancelledError'
  }
}

const ASPECT_RATIOS: Record<AspectRatio, number | undefined> = {
  original: undefined,
  '1:1': 1,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
}

function getCropGeometry(cropper: CropperRef): CreatePostCropGeometry | null {
  const state = cropper.getState()

  return state
    ? {
        coordinates: state.coordinates,
        transforms: state.transforms,
        visibleArea: state.visibleArea,
      }
    : null
}

function getCropGeometrySignature(
  geometry: CreatePostCropGeometry | undefined,
  ratio: AspectRatio,
): string | null {
  return geometry ? JSON.stringify({ ...geometry, ratio }) : null
}

function getExportMimeType(image: CreatePostImage): 'image/jpeg' | 'image/png' {
  const originalType = image.file?.type ?? image.fileInfo?.type

  return originalType === 'image/png' ? 'image/png' : 'image/jpeg'
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png',
  errorMessage: string,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error(errorMessage))
      },
      mimeType,
      mimeType === 'image/jpeg' ? 0.92 : undefined,
    )
  })
}

export function CropStep({
  activeImage,
  disabled = false,
  exportRef,
  images,
  onSetActiveImage,
  onAspectRatioChange,
  onCropGeometryChange,
  onRemoveImage,
  onAddImages,
}: CropStepProps) {
  const { t } = useI18n()
  const [isVisibleAspectRatio, setIsVisibleAspectRatio] = useState(false)
  const [isVisibleSlider, setIsVisibleSlider] = useState(false)
  const activeRatio = activeImage?.aspectRatio ?? 'original'
  const activeImageIndex = activeImage
    ? images.findIndex((image) => image.id === activeImage.id)
    : -1
  const canNavigatePrevious = activeImageIndex > 0
  const canNavigateNext = activeImageIndex >= 0 && activeImageIndex < images.length - 1
  const cropperRef = useRef<CropperRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(false)
  const activeImageRef = useRef(activeImage)
  const restoredCroppersRef = useRef(new WeakSet<CropperRef>())
  const exportRequestIdRef = useRef(0)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      exportRequestIdRef.current += 1
    }
  }, [])

  useEffect(() => {
    activeImageRef.current = activeImage
  }, [activeImage])

  useEffect(() => {
    exportRequestIdRef.current += 1
  }, [activeImage?.id])

  const isExportRequestCurrent = useCallback((requestId: number, imageId: string) => {
    return (
      mountedRef.current &&
      exportRequestIdRef.current === requestId &&
      activeImageRef.current?.id === imageId
    )
  }, [])

  const exportActiveImage = useCallback(async (): Promise<CropExportResult> => {
    const image = activeImageRef.current
    const cropper = cropperRef.current

    if (!image?.id || !cropper) {
      throw new Error(t.createPost.crop.previewNotReady)
    }

    const geometry = getCropGeometry(cropper)

    if (!geometry) {
      throw new Error(t.createPost.crop.previewNotReady)
    }

    const signature = getCropGeometrySignature(geometry, image.aspectRatio)
    const canReuseExport =
      Boolean(image.cropped) &&
      getCropGeometrySignature(image.cropGeometry, image.aspectRatio) === signature

    if (canReuseExport && image.cropped) {
      return {
        cropped: image.cropped,
        geometry,
        imageId: image.id,
        ratio: image.aspectRatio,
      }
    }

    const canvas = cropper.getCanvas()

    if (!canvas) {
      throw new Error(t.createPost.crop.previewNotReady)
    }

    const requestId = exportRequestIdRef.current + 1
    exportRequestIdRef.current = requestId
    const mimeType = getExportMimeType(image)
    const blob = await canvasToBlob(canvas, mimeType, t.createPost.crop.exportFailed)

    if (!isExportRequestCurrent(requestId, image.id)) {
      throw new CropExportCancelledError()
    }

    const fileName = image.file?.name ?? image.name ?? 'cropped-image.jpg'
    const file = new File([blob], fileName, {
      type: blob.type || mimeType,
      lastModified: Date.now(),
    })
    const objectUrl = URL.createObjectURL(file)

    if (!isExportRequestCurrent(requestId, image.id)) {
      URL.revokeObjectURL(objectUrl)
      throw new CropExportCancelledError()
    }

    return {
      imageId: image.id,
      ratio: image.aspectRatio,
      geometry,
      cropped: {
        objectUrl,
        file,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
      },
    }
  }, [isExportRequestCurrent, t.createPost.crop.exportFailed, t.createPost.crop.previewNotReady])

  useImperativeHandle(exportRef, () => ({ exportActiveImage }), [exportActiveImage])

  const handleCropperChange = (cropper: CropperRef) => {
    const image = activeImage
    const geometry = getCropGeometry(cropper)

    if (!image || !geometry) {
      return
    }

    if (image.cropGeometry && !restoredCroppersRef.current.has(cropper)) {
      return
    }

    if (
      getCropGeometrySignature(image.cropGeometry, image.aspectRatio) ===
      getCropGeometrySignature(geometry, image.aspectRatio)
    ) {
      return
    }

    onCropGeometryChange(image.id, geometry)
  }

  const handleCropperReady = (cropper: CropperRef) => {
    const geometry = activeImage?.cropGeometry

    if (!geometry) {
      return
    }

    restoredCroppersRef.current.add(cropper)
    cropper.setState((state) =>
      state
        ? {
            ...state,
            coordinates: geometry.coordinates,
            transforms: geometry.transforms,
            visibleArea: geometry.visibleArea,
          }
        : state,
    )
  }

  const switchActiveImage = (imageId: string | null) => {
    if (disabled) {
      return
    }

    onSetActiveImage(imageId)
  }
  const hasReachedImagesLimit = images.length >= MAX_IMAGES_COUNT

  const handleSelectFiles = () => {
    if (disabled) {
      return
    }

    if (hasReachedImagesLimit) {
      setErrors([t.createPost.upload.imageLimit])

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

  const handleSelectedFiles = (selectedFiles: File[]) => {
    if (disabled || selectedFiles.length === 0) {
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

  const handleRemoveImage = (image: CreatePostImage) => {
    if (disabled) {
      return
    }

    const currentIndex = images.findIndex((item) => item.id === image.id)
    const nextImages = images.filter((item) => item.id !== image.id)

    onRemoveImage(image.id)

    if (activeImage?.id !== image.id) {
      return
    }

    if (nextImages.length === 0) {
      switchActiveImage(null)
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

    switchActiveImage(nextImages[nextIndex].id)
  }

  const handleRatioSelect = (ratio: AspectRatio) => {
    if (disabled || !activeImage?.id || ratio === activeImage.aspectRatio) {
      return
    }

    onAspectRatioChange(activeImage.id, ratio)
  }

  const handleNextImage = () => {
    if (disabled || !canNavigateNext) return

    switchActiveImage(images[activeImageIndex + 1].id)
  }

  const handlePrevImage = () => {
    if (disabled || !canNavigatePrevious) return

    switchActiveImage(images[activeImageIndex - 1].id)
  }

  const handleVisibleAspectRatioChange = () => {
    if (disabled) {
      return
    }

    setIsVisibleSlider(false)
    setIsVisibleAspectRatio((isVisible) => !isVisible)
  }

  const handleVisibleSliderChange = () => {
    if (disabled) {
      return
    }

    setIsVisibleAspectRatio(false)
    setIsVisibleSlider((isVisible) => !isVisible)
  }

  return (
    <div className={styles.cropWrapper}>
      <Cropper
        key={activeImage?.id ?? 'empty-cropper'}
        ref={cropperRef}
        src={activeImage?.previewUrl}
        className={styles.activePreviewImage}
        disabled={disabled}
        onChange={handleCropperChange}
        onReady={handleCropperReady}
        stencilProps={{
          aspectRatio: ASPECT_RATIOS[activeRatio],
        }}
      />
      {isVisibleAspectRatio && (
        <AspectButtonsBlock
          disabled={disabled}
          onSelectRatio={handleRatioSelect}
          selectedRatio={activeRatio}
        />
      )}
      <IconButton
        disabled={disabled}
        onClick={handleVisibleAspectRatioChange}
        className={styles.aspectRatioButton}
        icon={AspectRatioBtn}
        label={t.createPost.crop.aspectRatio}
        data-active={isVisibleAspectRatio}
        aria-expanded={isVisibleAspectRatio}
      />

      <IconButton
        disabled={disabled}
        onClick={handleVisibleSliderChange}
        className={styles.showSwiper}
        icon={ShowSwiper}
        label={t.createPost.actions.showImages}
        data-active={isVisibleSlider}
        aria-expanded={isVisibleSlider}
      />

      {isVisibleSlider && (
        <>
          <input
            ref={fileInputRef}
            accept={ACCEPTED_IMAGE_TYPES_INPUT_VALUE}
            className={styles.fileInput}
            disabled={disabled}
            multiple
            onChange={handleFileChange}
            type="file"
          />
          <div className={styles.galleryPanel}>
            <div className={styles.swiper} aria-label={t.createPost.crop.selectedImages}>
              {visibleImages.map((image) => {
                const isActive = image.id === activeImage?.id
                const imageSrc = isActive
                  ? image.previewUrl
                  : (image.cropped?.objectUrl ?? image.previewUrl)

                return (
                  <div
                    key={image.id}
                    role="button"
                    className={styles.swiperItem}
                    data-active={isActive}
                    aria-disabled={disabled}
                    onClick={() => switchActiveImage(image.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        switchActiveImage(image.id)
                      }
                    }}
                    tabIndex={disabled ? -1 : 0}
                  >
                    {imageSrc ? (
                      <>
                        <Image
                          className={styles.swiperImage}
                          src={imageSrc}
                          alt={image.name}
                          unoptimized
                          width={80}
                          height={82}
                        />
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation()
                            handleRemoveImage(image)
                          }}
                          className={styles.deleteImage}
                          disabled={disabled}
                          icon={Close}
                          label={t.createPost.actions.deleteImage}
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
                  label={t.createPost.actions.addImage}
                  disabled={disabled || hasReachedImagesLimit}
                  onClick={handleSelectFiles}
                />
              </div>
            </div>

            <div className={styles.paginationWrapper} aria-label={t.createPost.crop.paginationItem}>
              {images.map((image) => {
                const isActive = image.id === activeImage?.id

                return (
                  <IconButton
                    key={image.id}
                    icon={Dot}
                    className={styles.paginationItem}
                    label={t.createPost.crop.paginationItem}
                    data-active={isActive}
                  />
                )
              })}
            </div>
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
        {canNavigatePrevious && (
          <IconButton
            className={styles.navigationItem}
            icon={ArrowBackIcon}
            label={t.createPost.crop.previousImage}
            onClick={handlePrevImage}
            disabled={disabled}
            data-direction="previous"
          />
        )}
        {canNavigateNext && (
          <IconButton
            className={styles.navigationItem}
            icon={ArrowNextIcon}
            label={t.createPost.crop.nextImage}
            onClick={handleNextImage}
            disabled={disabled}
            data-direction="next"
          />
        )}
      </div>
    </div>
  )
}
