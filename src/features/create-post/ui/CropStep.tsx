'use client'

import type { AspectRatio, CreatePostImage } from '@/features/create-post'
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
  Dot,
  ShowSwiper,
} from '@/shared/assets'
import { AspectButtonsBlock } from '@/features/create-post/ui/aspectButtonsBlock/AspectButtonsBlock'

export type CropStepProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onSetActiveImage: (imageId: string | null) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

export function CropStep({
  activeImage,
  images,
  onSetActiveImage,
  onAspectRatioChange,
  onImageExported,
}: CropStepProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('original')
  const [isVisibleAspectRatio, setIsVisibleAspectRatio] = useState(false)
  const [isVisibleSlider, setIsVisibleSlider] = useState(false)

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

    onImageExported(activeImage.id, exported)
    onAspectRatioChange(activeImage.id, ratio)
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
          <div className={styles.swiper} aria-label="Selected images">
            {images.map((image) => {
              const imageSrc = image.exported?.objectUrl || image.previewUrl
              const isActive = image.id === activeImage?.id

              return (
                <button
                  key={image.id}
                  type="button"
                  className={styles.swiperItem}
                  data-active={isActive}
                  onClick={() => onSetActiveImage(image.id)}
                >
                  {imageSrc ? (
                    <img className={styles.swiperImage} src={imageSrc} alt={image.name} />
                  ) : (
                    <span className={styles.swiperPlaceholder}>{image.name}</span>
                  )}
                </button>
              )
            })}
            <div className={styles.wrapperAddImage}>
              <IconButton className={styles.addImage} icon={AddImage} label="AddImage" />
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
        </>
      )}

      <div className={styles.navigationWrapper}>
        <IconButton
          className={styles.navigationItem}
          icon={ArrowBackIcon}
          label={'ArrowBackIcon'}
          onClick={handlePrevImage}
        />
        <IconButton
          className={styles.navigationItem}
          icon={ArrowNextIcon}
          label={'ArrowNextIcon'}
          onClick={handleNextImage}
        />
      </div>
    </div>
  )
}
