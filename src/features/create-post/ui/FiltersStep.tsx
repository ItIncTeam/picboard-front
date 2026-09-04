'use client'

import Image from 'next/image'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { CreatePostImage, CreatePostImageArtifact, ImageFilter } from '@/features/create-post'
import { CREATE_POST_FILTERS } from '@/features/create-post/lib/createPostConstants'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/typography'

import styles from './filters-step.module.css'

const FILTER_STYLES: Record<ImageFilter, string> = {
  normal: 'none',
  clarendon: 'contrast(1.2) saturate(1.35)',
  lark: 'brightness(1.08) contrast(0.9) saturate(1.15)',
  gingham: 'brightness(1.05) contrast(0.9) sepia(0.15)',
  moon: 'grayscale(1) contrast(1.1) brightness(1.05)',
}

export type FiltersStepProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onExportingChange: (isExporting: boolean) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type FilterExportState = {
  error: FilterExportErrorCode | null
  key: string | null
  status: 'idle' | 'pending'
}

type FilterExportErrorCode = 'exportFailed' | 'unsupportedBrowser'

class FilterExportError extends Error {
  constructor(readonly code: FilterExportErrorCode) {
    super(code)
    this.name = 'FilterExportError'
  }
}

function getExportMimeType(file: File): 'image/jpeg' | 'image/png' {
  return file.type === 'image/png' ? 'image/png' : 'image/jpeg'
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: 'image/jpeg' | 'image/png') {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new FilterExportError('exportFailed'))
      },
      mimeType,
      mimeType === 'image/jpeg' ? 0.92 : undefined,
    )
  })
}

async function exportFilteredImage(
  cropped: CreatePostImageArtifact,
  filter: Exclude<ImageFilter, 'normal'>,
): Promise<CreatePostImageArtifact> {
  const bitmap = await createImageBitmap(cropped.file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    throw new FilterExportError('unsupportedBrowser')
  }

  canvas.width = bitmap.width
  canvas.height = bitmap.height

  try {
    context.filter = FILTER_STYLES[filter]
    context.drawImage(bitmap, 0, 0)
  } finally {
    bitmap.close()
  }

  const mimeType = getExportMimeType(cropped.file)
  const blob = await canvasToBlob(canvas, mimeType)
  const file = new File([blob], cropped.file.name, {
    lastModified: Date.now(),
    type: blob.type || mimeType,
  })

  return {
    file,
    fileInfo: {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type,
    },
    objectUrl: URL.createObjectURL(file),
  }
}

export function FiltersStep({
  activeImage,
  images,
  onExportingChange,
  onFilterChange,
  onImageExported,
  onRemoveImage,
  onSetActiveImage,
}: FiltersStepProps) {
  const { t } = useI18n()
  const notifyExportingChange = useEffectEvent((isExporting: boolean) => {
    onExportingChange(isExporting)
  })
  const notifyImageExported = useEffectEvent(
    (imageId: string, exported: CreatePostImage['exported']) => {
      onImageExported(imageId, exported)
    },
  )
  const [exportState, setExportState] = useState<FilterExportState>({
    error: null,
    key: null,
    status: 'idle',
  })
  const [retryVersion, setRetryVersion] = useState(0)
  const requestIdRef = useRef(0)
  const exportKey = activeImage?.cropped
    ? `${activeImage.id}:${activeImage.filter}:${activeImage.cropped.objectUrl}:${retryVersion}`
    : null
  const isExporting = exportState.key === exportKey && exportState.status === 'pending'
  const filterLabels: Record<ImageFilter, string> = t.createPost.filters.labels
  const exportErrorMessages: Record<FilterExportErrorCode, string> = {
    exportFailed: t.createPost.filters.exportFailed,
    unsupportedBrowser: t.createPost.filters.unsupportedBrowser,
  }
  let error: string | null = null

  if (activeImage && !activeImage.cropped) {
    error = t.createPost.filters.cropFirst
  } else if (exportState.key === exportKey && exportState.error) {
    error = exportErrorMessages[exportState.error]
  }

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    let disposed = false

    if (!activeImage?.cropped) {
      notifyExportingChange(false)

      return () => {
        disposed = true
        requestIdRef.current += 1
        notifyExportingChange(false)
      }
    }

    if (activeImage.exported) {
      notifyExportingChange(false)

      return () => {
        disposed = true
        requestIdRef.current += 1
        notifyExportingChange(false)
      }
    }

    if (activeImage.filter === 'normal') {
      notifyImageExported(activeImage.id, activeImage.cropped)
      notifyExportingChange(false)

      return () => {
        disposed = true
        requestIdRef.current += 1
        notifyExportingChange(false)
      }
    }

    const imageId = activeImage.id
    const cropped = activeImage.cropped
    const filter = activeImage.filter

    void Promise.resolve()
      .then(() => {
        if (disposed || requestIdRef.current !== requestId) {
          return null
        }

        setExportState({ error: null, key: exportKey, status: 'pending' })
        notifyExportingChange(true)

        return exportFilteredImage(cropped, filter)
      })
      .then((artifact) => {
        if (!artifact) {
          return
        }

        if (disposed || requestIdRef.current !== requestId) {
          URL.revokeObjectURL(artifact.objectUrl)
          return
        }

        setExportState({ error: null, key: exportKey, status: 'idle' })
        notifyExportingChange(false)
        notifyImageExported(imageId, artifact)
      })
      .catch((exportError: unknown) => {
        if (disposed || requestIdRef.current !== requestId) {
          return
        }

        setExportState({
          error: exportError instanceof FilterExportError ? exportError.code : 'exportFailed',
          key: exportKey,
          status: 'idle',
        })
        notifyExportingChange(false)
      })

    return () => {
      disposed = true
      requestIdRef.current += 1
      notifyExportingChange(false)
    }
  }, [activeImage, exportKey, retryVersion])

  const activePreview = activeImage?.cropped?.objectUrl

  return (
    <section className={styles.root} aria-label={t.createPost.filters.ariaLabel}>
      <div className={styles.previewPanel}>
        {activeImage && activePreview ? (
          <Image
            alt={activeImage.name}
            className={styles.activePreviewImage}
            fill
            sizes="min(100vw, 492px)"
            src={activePreview}
            style={{ filter: FILTER_STYLES[activeImage.filter] }}
            unoptimized
          />
        ) : (
          <Text as="p" className={styles.placeholder} size="sm">
            {t.createPost.filters.placeholder}
          </Text>
        )}

        {images.length > 0 && (
          <ul className={styles.imageList} aria-label={t.createPost.filters.selectedImages}>
            {images.map((image) => {
              const imageSource = image.cropped?.objectUrl

              return (
                <li
                  key={image.id}
                  className={styles.imageItem}
                  data-active={image.id === activeImage?.id}
                >
                  <button
                    aria-label={`${t.createPost.filters.selectImagePrefix} ${image.id}`}
                    aria-pressed={image.id === activeImage?.id}
                    className={styles.imageButton}
                    onClick={() => onSetActiveImage(image.id)}
                    type="button"
                  >
                    {imageSource && (
                      <Image
                        alt={image.name}
                        className={styles.thumbnail}
                        fill
                        sizes="64px"
                        src={imageSource}
                        style={{ filter: FILTER_STYLES[image.filter] }}
                        unoptimized
                      />
                    )}
                  </button>
                  <button
                    aria-label={`${t.createPost.filters.removeImagePrefix} ${image.id}`}
                    className={styles.removeButton}
                    onClick={() => onRemoveImage(image.id)}
                    type="button"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={styles.filterPanel}>
        <Text as="p" className={styles.panelTitle} size="md">
          {t.createPost.filters.title}
        </Text>
        <div className={styles.filterList} aria-label={t.createPost.filters.availableFilters}>
          {CREATE_POST_FILTERS.map((filter) => (
            <button
              key={filter}
              aria-pressed={activeImage?.filter === filter}
              className={styles.filterButton}
              disabled={!activeImage?.cropped}
              onClick={() => activeImage && onFilterChange(activeImage.id, filter)}
              type="button"
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>

        {isExporting && (
          <Text as="p" className={styles.status} role="status" size="sm">
            {t.createPost.filters.applying}
          </Text>
        )}
        {error && (
          <div className={styles.error} role="alert">
            <Text as="p" size="sm">
              {error}
            </Text>
            {activeImage?.cropped && activeImage.filter !== 'normal' && (
              <Button onClick={() => setRetryVersion((version) => version + 1)} type="button">
                {t.createPost.actions.retry}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
