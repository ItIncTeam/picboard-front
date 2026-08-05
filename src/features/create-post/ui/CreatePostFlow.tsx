'use client'

import { CreatePostCloseConfirm } from '@/features/create-post/ui/CreatePostCloseConfirm'
import type { RefObject } from 'react'
import { useEffect, useReducer, useRef, useState } from 'react'

import { ArrowBackIcon, Close } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Text, Title } from '@/shared/ui/typography'

import { CREATE_POST_STEPS } from '../lib/createPostConstants'
import { createPost } from '../api/createPostApi'
import { useCreatePostPreviewUrlCleanup } from '../lib/useCreatePostPreviewUrlCleanup'
import { createPostInitialState, createPostReducer } from '@/features/create-post'
import { uploadCreatePostImages } from '@/features/create-post'
import {
  selectActiveImage,
  selectCanGoNext,
  selectCanPublish,
  selectHasCreatePostUnsavedData,
} from '@/features/create-post'
import type {
  AspectRatio,
  CreatePostImage,
  CreatePostState,
  CreatePostStep,
  ImageFilter,
} from '@/features/create-post'
import {
  CropExportCancelledError,
  CropStep,
  type CropExportResult,
  type CropStepHandle,
} from './CropStep'
import { FiltersStep } from './FiltersStep'
import { PublicationStep } from './PublicationStep'
import { UploadStep } from './UploadStep'
import styles from './create-post-flow.module.css'

type CreatePostFlowProps = {
  initialState?: CreatePostState
  onCloseAction?: () => void
  onPublishAction?: (state: CreatePostState) => Promise<void> | void
}

const stepTitles: Record<CreatePostStep, string> = {
  upload: 'Add Photo',
  crop: 'Cropping',
  filters: 'Filters',
  publication: 'Publication',
}

export function CreatePostFlow({
  initialState = createPostInitialState,
  onCloseAction,
  onPublishAction,
}: CreatePostFlowProps) {
  const [state, dispatch] = useReducer(createPostReducer, initialState)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [cropExportError, setCropExportError] = useState<string | null>(null)
  const [isCropExporting, setIsCropExporting] = useState(false)
  const cropStepRef = useRef<CropStepHandle>(null)
  const cropExportingRef = useRef(false)
  const cropExportRequestIdRef = useRef(0)
  const mountedRef = useRef(false)

  useCreatePostPreviewUrlCleanup(state.images)

  const currentStepIndex = CREATE_POST_STEPS.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === CREATE_POST_STEPS.length - 1
  const canGoNext = selectCanGoNext(state)
  const canPublish = selectCanPublish(state)
  const activeImage = selectActiveImage(state)
  const isUploadHeader = state.step === 'upload' && state.images.length === 0
  const flowSize = state.step === 'filters' || state.step === 'publication' ? 'wide' : 'compact'
  const isCropStep = state.step === 'crop'
  const activeImageIdRef = useRef(activeImage?.id)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      cropExportRequestIdRef.current += 1
      cropExportingRef.current = false
    }
  }, [])

  useEffect(() => {
    activeImageIdRef.current = activeImage?.id
  }, [activeImage?.id])

  useEffect(() => {
    cropExportRequestIdRef.current += 1
  }, [activeImage?.id])

  const invalidateCropExport = () => {
    cropExportRequestIdRef.current += 1
    cropExportingRef.current = false
    setIsCropExporting(false)
  }

  const handleAddImages = (images: CreatePostImage[]) => {
    dispatch({ type: 'addImages', images })
  }

  const handleRemoveImage = (imageId: string) => {
    invalidateCropExport()
    dispatch({ type: 'removeImage', imageId })
  }

  const handleSetActiveImage = (imageId: string | null) => {
    if (imageId !== activeImageIdRef.current) {
      invalidateCropExport()
    }

    dispatch({ type: 'setActiveImage', imageId })
  }

  const handleAspectRatioChange = (imageId: string, aspectRatio: AspectRatio) => {
    dispatch({ type: 'setImageAspectRatio', aspectRatio, imageId })
  }

  const handleFilterChange = (imageId: string, filter: ImageFilter) => {
    dispatch({ type: 'setImageFilter', filter, imageId })
  }

  const handleImageExported = (imageId: string, exported: CreatePostImage['exported']) => {
    dispatch({ type: 'setImageExported', exported, imageId })
  }

  const handleImageDirty = (imageId: string) => {
    dispatch({ type: 'setImageExported', exported: undefined, imageId })
  }

  const handleCaptionChange = (caption: string) => {
    dispatch({ type: 'setCaption', caption })
  }

  const handleBack = () => {
    if (state.isPublishing || cropExportingRef.current) {
      return
    }

    dispatch({ type: 'goBack' })
  }

  const isCropRequestCurrent = (requestId: number, imageId: string) => {
    return (
      mountedRef.current &&
      cropExportRequestIdRef.current === requestId &&
      activeImageIdRef.current === imageId
    )
  }

  const revokeUncommittedCropResult = (
    result: CropExportResult,
    previousExport: CreatePostImage['exported'],
  ) => {
    if (result.exported !== previousExport) {
      URL.revokeObjectURL(result.exported.objectUrl)
    }
  }

  const handleNext = async () => {
    if (state.isPublishing || cropExportingRef.current || !canGoNext) {
      return
    }

    if (!isCropStep) {
      dispatch({ type: 'goNext' })
      return
    }

    const image = activeImage
    const cropStep = cropStepRef.current

    if (!image || !cropStep) {
      setCropExportError('Crop preview is not ready. Please try again.')
      return
    }

    const requestId = cropExportRequestIdRef.current + 1
    cropExportRequestIdRef.current = requestId
    cropExportingRef.current = true
    setCropExportError(null)
    setIsCropExporting(true)

    try {
      const result = await cropStep.exportActiveImage()

      if (!isCropRequestCurrent(requestId, image.id) || result.imageId !== image.id) {
        revokeUncommittedCropResult(result, image.exported)
        return
      }

      handleImageExported(result.imageId, result.exported)

      const activeIndex = state.images.findIndex(({ id }) => id === result.imageId)
      const followingImages = [
        ...state.images.slice(activeIndex + 1),
        ...state.images.slice(0, Math.max(activeIndex, 0)),
      ]
      const nextImage = followingImages.find(({ exported }) => !exported)

      if (nextImage) {
        dispatch({ type: 'setActiveImage', imageId: nextImage.id })
        return
      }

      dispatch({ type: 'goNext' })
    } catch (error) {
      if (error instanceof CropExportCancelledError || !isCropRequestCurrent(requestId, image.id)) {
        return
      }

      setCropExportError(
        error instanceof Error
          ? error.message
          : 'Could not export the cropped image. Please try again.',
      )
    } finally {
      if (mountedRef.current && cropExportRequestIdRef.current === requestId) {
        cropExportingRef.current = false
        setIsCropExporting(false)
      }
    }
  }

  const handlePublish = async () => {
    if (!canPublish || state.isPublishing) {
      return
    }

    setPublishError(null)
    dispatch({ type: 'setPublishing', isPublishing: true })

    try {
      if (onPublishAction) {
        await onPublishAction(state)

        return
      }

      const fileIds = await uploadCreatePostImages(state, { dispatch })
      const description = state.caption.trim() || undefined

      await createPost({ description, fileIds })

      dispatch({ type: 'reset' })
      onCloseAction?.()
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Post publishing failed.')
    } finally {
      dispatch({ type: 'setPublishing', isPublishing: false })
    }
  }

  const handleClose = () => {
    if (cropExportingRef.current) {
      invalidateCropExport()
    }

    if (selectHasCreatePostUnsavedData(state)) {
      setIsCloseConfirmOpen(true)

      return
    }
    onCloseAction?.()
  }

  const handleDiscard = () => {
    invalidateCropExport()
    dispatch({ type: 'reset' })
    onCloseAction?.()
  }

  return (
    <section className={styles.root} data-size={flowSize} aria-label="Create post flow">
      {isUploadHeader ? (
        <UploadHeader onCloseAction={handleClose} />
      ) : (
        <WizardHeader
          canGoNext={canGoNext}
          canPublish={canPublish}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isPublishing={state.isPublishing}
          isCropExporting={isCropExporting}
          isCropStep={isCropStep}
          onBack={handleBack}
          onNext={handleNext}
          onPublish={handlePublish}
          step={state.step}
        />
      )}

      <div className={styles.body}>
        <StepContent
          activeImage={activeImage}
          cropStepRef={cropStepRef}
          isCropExporting={isCropExporting}
          onAddImages={handleAddImages}
          onAspectRatioChange={handleAspectRatioChange}
          onCaptionChange={handleCaptionChange}
          onFilterChange={handleFilterChange}
          onImageDirty={handleImageDirty}
          onImageExported={handleImageExported}
          onRemoveImage={handleRemoveImage}
          onRetryUpload={handlePublish}
          onSetActiveImage={handleSetActiveImage}
          state={state}
        />
      </div>
      {publishError && (
        <Text as="p" className={styles.error} role="alert" size="sm">
          {publishError}
        </Text>
      )}
      {cropExportError && isCropStep && (
        <Text as="p" className={styles.error} role="alert" size="sm">
          {cropExportError}
        </Text>
      )}
      <CreatePostCloseConfirm
        onDiscardAction={handleDiscard}
        onKeepEditingAction={() => setIsCloseConfirmOpen(false)}
        open={isCloseConfirmOpen}
      />
    </section>
  )
}

function UploadHeader({ onCloseAction }: { onCloseAction?: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerSlot} />

      <Title className={styles.title} level="h2">
        {stepTitles.upload}
      </Title>

      <div className={styles.actionSlot}>
        {onCloseAction && (
          <IconButton
            className={styles.closeButton}
            icon={Close}
            label="Close"
            onClick={onCloseAction}
          />
        )}
      </div>
    </header>
  )
}

type WizardHeaderProps = {
  canGoNext: boolean
  canPublish: boolean
  isFirstStep: boolean
  isLastStep: boolean
  isPublishing: boolean
  isCropExporting: boolean
  isCropStep: boolean
  onBack: () => void
  onNext: () => void
  onPublish: () => void | Promise<void>
  step: CreatePostStep
}

function WizardHeader({
  canGoNext,
  canPublish,
  isFirstStep,
  isLastStep,
  isPublishing,
  isCropExporting,
  isCropStep,
  onBack,
  onNext,
  onPublish,
  step,
}: WizardHeaderProps) {
  const isNextDisabled = !canGoNext || (isCropStep && isCropExporting)
  const isBackDisabled = isCropStep && isCropExporting
  return (
    <header className={styles.header}>
      <div className={styles.headerSlot}>
        {!isFirstStep && (
          <IconButton
            className={styles.backButton}
            disabled={isPublishing || isBackDisabled}
            icon={ArrowBackIcon}
            label="Back"
            onClick={onBack}
          />
        )}
      </div>

      <Title className={styles.title} level="h2">
        {stepTitles[step]}
      </Title>

      <div className={styles.actionSlot}>
        {isLastStep ? (
          <Button
            className={styles.headerAction}
            disabled={!canPublish || isPublishing}
            loading={isPublishing}
            loadingText="Publishing"
            onClick={onPublish}
            type="button"
            variant="textButton"
          >
            Publish
          </Button>
        ) : (
          <Button
            className={styles.headerAction}
            disabled={!canGoNext || isPublishing || isNextDisabled}
            onClick={onNext}
            type="button"
            variant="textButton"
          >
            Next
          </Button>
        )}
      </div>
    </header>
  )
}

type RenderStepArgs = {
  activeImage: CreatePostImage | null
  cropStepRef: RefObject<CropStepHandle | null>
  isCropExporting: boolean
  onAddImages: (images: CreatePostImage[]) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCaptionChange: (caption: string) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageDirty: (imageId: string) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onRetryUpload: () => void | Promise<void>
  onSetActiveImage: (imageId: string | null) => void
  state: CreatePostState
}

function StepContent({
  activeImage,
  cropStepRef,
  isCropExporting,
  onAddImages,
  onAspectRatioChange,
  onCaptionChange,
  onFilterChange,
  onImageDirty,
  onImageExported,
  onRemoveImage,
  onRetryUpload,
  onSetActiveImage,
  state,
}: RenderStepArgs) {
  switch (state.step) {
    case 'upload':
      return (
        <UploadStep
          activeImageId={state.activeImageId}
          images={state.images}
          onAddImages={onAddImages}
          onRemoveImage={onRemoveImage}
          onSetActiveImage={onSetActiveImage}
        />
      )

    case 'crop':
      return (
        <CropStep
          activeImage={activeImage}
          disabled={isCropExporting}
          exportRef={cropStepRef}
          images={state.images}
          onSetActiveImage={onSetActiveImage}
          onAspectRatioChange={onAspectRatioChange}
          onImageDirty={onImageDirty}
          onRemoveImage={onRemoveImage}
          onAddImages={onAddImages}
        />
      )

    case 'filters':
      return (
        <FiltersStep
          activeImage={activeImage}
          onFilterChange={onFilterChange}
          onImageExported={onImageExported}
        />
      )

    case 'publication':
      return (
        <PublicationStep
          caption={state.caption}
          images={state.images}
          isPublishing={state.isPublishing}
          onCaptionChange={onCaptionChange}
          onRetryUpload={onRetryUpload}
        />
      )
  }
}
