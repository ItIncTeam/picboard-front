import Image from 'next/image'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'

import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/typography'

import { CREATE_POST_FILTERS } from '@/features/create-post/lib/createPostConstants'
import type { CreatePostImage, ImageFilter } from '@/features/create-post'
import { CreatePostSkeleton } from './CreatePostSkeleton'
import styles from './filters-step.module.css'

export type FiltersStepProps = {
  activeImage: CreatePostImage | null
  onFilterBaseChange: (imageId: string, filterBase: CreatePostImage['filterBase']) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onFilterExportingChange: (imageId: string, isExporting: boolean) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

const imageFilterCssValues: Record<ImageFilter, string> = {
  clarendon: 'contrast(1.15) saturate(1.25)',
  gingham: 'sepia(0.15) contrast(0.9) brightness(1.05)',
  lark: 'brightness(1.08) contrast(0.95) saturate(1.2)',
  moon: 'grayscale(1) contrast(1.1) brightness(1.05)',
  normal: 'none',
}

export function FiltersStep({
  activeImage,
  onFilterBaseChange,
  onFilterChange,
  onFilterExportingChange,
  onImageExported,
}: FiltersStepProps) {
  if (!activeImage) {
    return (
      <CreatePostSkeleton description="Choose an image before applying filters." title="Filters" />
    )
  }

  return (
    <ActiveFiltersStep
      activeImage={activeImage}
      key={activeImage.id}
      onFilterBaseChange={onFilterBaseChange}
      onFilterChange={onFilterChange}
      onFilterExportingChange={onFilterExportingChange}
      onImageExported={onImageExported}
    />
  )
}

type ActiveFiltersStepProps = {
  activeImage: CreatePostImage
  onFilterBaseChange: (imageId: string, filterBase: CreatePostImage['filterBase']) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onFilterExportingChange: (imageId: string, isExporting: boolean) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

function ActiveFiltersStep({
  activeImage,
  onFilterBaseChange,
  onFilterChange,
  onFilterExportingChange,
  onImageExported,
}: ActiveFiltersStepProps) {
  const [baseExport] = useState<CreatePostImage['filterBase']>(() => createFilterBase(activeImage))
  const [exportError, setExportError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<ImageFilter>(activeImage.filter)
  const exportRequestIdRef = useRef(0)
  const isMountedRef = useRef(true)
  const baseFile = baseExport?.file ?? null
  const basePreviewUrl = baseExport?.objectUrl ?? null

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      exportRequestIdRef.current += 1
      onFilterExportingChange(activeImage.id, false)
    }
  }, [activeImage.id, onFilterExportingChange])

  const handleFilterSelect = (filter: ImageFilter) => {
    setSelectedFilter(filter)
    setExportError(null)

    if (!baseFile || !baseExport) {
      setExportError('Selected image is not available for export.')
      setSelectedFilter(activeImage.filter)

      return
    }

    onFilterBaseChange(activeImage.id, activeImage.filterBase ?? baseExport)
    onFilterExportingChange(activeImage.id, true)

    void exportFilteredImage({
      file: baseFile,
      filter,
      imageId: activeImage.id,
      isActive: () => isMountedRef.current,
      onExportFailed: () => {
        setSelectedFilter(activeImage.filter)
        onFilterExportingChange(activeImage.id, false)
      },
      onExported: onImageExported,
      onFilterChange,
      onFilterExported: () => onFilterExportingChange(activeImage.id, false),
      requestId: exportRequestIdRef.current + 1,
      requestIdRef: exportRequestIdRef,
      setExportError,
    })
  }

  return (
    <section className={styles.root} aria-label="Filters editor">
      <div className={styles.previewPane}>
        {basePreviewUrl ? (
          <Image
            alt={activeImage.name}
            className={styles.previewImage}
            fill
            sizes="(max-width: 640px) 100vw, 70vw"
            src={basePreviewUrl}
            style={{ filter: imageFilterCssValues[selectedFilter] }}
            unoptimized
          />
        ) : (
          <Text as="p" className={styles.emptyPreview} size="sm">
            Preview is not available
          </Text>
        )}
      </div>

      <div className={styles.controls} aria-label="Available filters">
        {CREATE_POST_FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter

          return (
            <Button
              aria-pressed={isSelected}
              className={styles.filterButton}
              data-selected={isSelected ? 'true' : 'false'}
              key={filter}
              onClick={() => handleFilterSelect(filter)}
              type="button"
              variant="outlined"
            >
              {basePreviewUrl ? (
                <span aria-hidden className={styles.filterThumbnailFrame}>
                  <Image
                    alt=""
                    className={styles.filterThumbnail}
                    fill
                    sizes="6rem"
                    src={basePreviewUrl}
                    style={{ filter: imageFilterCssValues[filter] }}
                    unoptimized
                  />
                </span>
              ) : (
                <span aria-hidden className={styles.filterThumbnailPlaceholder} />
              )}
              <span className={styles.filterName}>{formatFilterName(filter)}</span>
            </Button>
          )
        })}

        {exportError && (
          <Text as="p" className={styles.error} role="alert" size="sm">
            {exportError}
          </Text>
        )}
      </div>
    </section>
  )
}

type ExportFilteredImageArgs = {
  file: File
  filter: ImageFilter
  imageId: string
  isActive: () => boolean
  onExportFailed: () => void
  onExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onFilterExported: () => void
  requestId: number
  requestIdRef: MutableRefObject<number>
  setExportError: (message: string | null) => void
}

async function exportFilteredImage({
  file,
  filter,
  imageId,
  isActive,
  onExportFailed,
  onExported,
  onFilterChange,
  onFilterExported,
  requestId,
  requestIdRef,
  setExportError,
}: ExportFilteredImageArgs) {
  requestIdRef.current = requestId

  try {
    const filteredFile = await createFilteredFile(file, imageFilterCssValues[filter])

    if (!isActive() || requestIdRef.current !== requestId) {
      return
    }

    const objectUrl = URL.createObjectURL(filteredFile)

    onFilterChange(imageId, filter)
    onExported(imageId, {
      file: filteredFile,
      fileInfo: createFileInfo(filteredFile),
      objectUrl,
    })
    onFilterExported()
  } catch {
    if (isActive() && requestIdRef.current === requestId) {
      onExportFailed()
      setExportError('Failed to apply filter. Try another filter.')
    }
  }
}

async function createFilteredFile(file: File, filter: string): Promise<File> {
  const image = await createImageBitmap(file)

  try {
    const canvas = document.createElement('canvas')

    canvas.width = image.width
    canvas.height = image.height

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Canvas context is not available')
    }

    ctx.filter = filter
    ctx.drawImage(image, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Failed to export canvas'))

          return
        }

        resolve(result)
      }, file.type)
    })

    return new File([blob], file.name, {
      lastModified: Date.now(),
      type: file.type,
    })
  } finally {
    image.close()
  }
}

function createFileInfo(file: File) {
  return {
    lastModified: file.lastModified,
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

function createFilterBase(image: CreatePostImage): CreatePostImage['filterBase'] {
  if (image.filterBase) {
    return image.filterBase
  }

  if (image.exported) {
    return image.exported
  }

  if (!image.file || !image.previewUrl) {
    return undefined
  }

  return {
    file: image.file,
    fileInfo: image.fileInfo ?? {
      lastModified: image.file.lastModified,
      name: image.file.name,
      size: image.file.size,
      type: image.file.type,
    },
    objectUrl: image.previewUrl,
  }
}

function formatFilterName(filter: ImageFilter): string {
  return filter.charAt(0).toUpperCase() + filter.slice(1)
}
