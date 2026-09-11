'use client'

import { CreatePostCloseConfirm } from '@/features/create-post/ui/CreatePostCloseConfirm'
import type { Ref, RefObject } from 'react'
import { useCallback, useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'

import { ArrowBackIcon, Close } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Text, Title } from '@/shared/ui/typography'

import { CREATE_POST_STEPS } from '../lib/createPostConstants'
import { createPost } from '../api/createPostApi'
import { useCreatePostPreviewUrlCleanup } from '../lib/useCreatePostPreviewUrlCleanup'
import { synchronizeCreatedPost } from '../model/synchronizeCreatedPost'
import { createPostInitialState, createPostReducer } from '@/features/create-post'
import { uploadCreatePostImages } from '@/features/create-post'
import {
  selectActiveImage,
  selectCanGoNext,
  selectCanPublish,
  selectHasAllImagesExported,
  selectHasCreatePostUnsavedData,
} from '@/features/create-post'
import type {
  AspectRatio,
  CreatePostCropGeometry,
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
  closeRequestRef?: Ref<CreatePostFlowHandle>
  initialState?: CreatePostState
  onCloseAction?: () => void
  onPublishAction?: (state: CreatePostState) => Promise<void> | void
}

export type CreatePostFlowHandle = {
  requestClose: () => void
}

export function CreatePostFlow({
  closeRequestRef,
  initialState = createPostInitialState,
  onCloseAction,
  onPublishAction,
}: CreatePostFlowProps) {
  const { t } = useI18n()
  const [state, dispatch] = useReducer(createPostReducer, initialState)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [cropExportError, setCropExportError] = useState<string | null>(null)
  const [isCropExporting, setIsCropExporting] = useState(false)
  const [isFilterExporting, setIsFilterExporting] = useState(false)
  const cropStepRef = useRef<CropStepHandle>(null)
  const cropExportingRef = useRef(false)
  const filterExportingRef = useRef(false)
  const cropExportRequestIdRef = useRef(0)
  const mountedRef = useRef(false)

  useCreatePostPreviewUrlCleanup(state.images)

  const currentStepIndex = CREATE_POST_STEPS.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === CREATE_POST_STEPS.length - 1
  const isFiltersStep = state.step === 'filters'
  const canGoNext = selectCanGoNext(state) && (!isFiltersStep || selectHasAllImagesExported(state))
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
      filterExportingRef.current = false
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

  const handleFilterChange = useCallback((imageId: string, filter: ImageFilter) => {
    dispatch({ type: 'setImageFilter', filter, imageId })
  }, [])

  const handleImageExported = useCallback(
    (imageId: string, exported: CreatePostImage['exported']) => {
      dispatch({ type: 'setImageExported', exported, imageId })
    },
    [],
  )

  const handleFilterExportingChange = useCallback((isExporting: boolean) => {
    filterExportingRef.current = isExporting
    setIsFilterExporting(isExporting)
  }, [])

  const handleCropGeometryChange = (imageId: string, geometry: CreatePostCropGeometry) => {
    dispatch({ type: 'setImageCropGeometry', geometry, imageId })
  }

  const handleCaptionChange = (caption: string) => {
    if (state.isPublishing) {
      return
    }

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
    previousCrop: CreatePostImage['cropped'],
  ) => {
    if (result.cropped !== previousCrop) {
      URL.revokeObjectURL(result.cropped.objectUrl)
    }
  }

  const handleNext = async () => {
    if (
      state.isPublishing ||
      cropExportingRef.current ||
      filterExportingRef.current ||
      !canGoNext
    ) {
      return
    }

    if (!isCropStep) {
      dispatch({ type: 'goNext' })
      return
    }

    const image = activeImage
    const cropStep = cropStepRef.current

    if (!image || !cropStep) {
      setCropExportError(t.createPost.crop.previewNotReady)
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
        revokeUncommittedCropResult(result, image.cropped)
        return
      }

      dispatch({
        type: 'setImageCropped',
        cropped: result.cropped,
        geometry: result.geometry,
        imageId: result.imageId,
      })

      const activeIndex = state.images.findIndex(({ id }) => id === result.imageId)
      const followingImages = [
        ...state.images.slice(activeIndex + 1),
        ...state.images.slice(0, Math.max(activeIndex, 0)),
      ]
      const nextImage = followingImages.find(({ cropped }) => !cropped)

      if (nextImage) {
        dispatch({ type: 'setActiveImage', imageId: nextImage.id })
        return
      }

      dispatch({ type: 'goNext' })
    } catch (error) {
      if (error instanceof CropExportCancelledError || !isCropRequestCurrent(requestId, image.id)) {
        return
      }

      setCropExportError(error instanceof Error ? error.message : t.createPost.crop.exportFailed)
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

    if (onPublishAction) {
      try {
        await onPublishAction(state)
      } catch (error) {
        setPublishError(error instanceof Error ? error.message : t.createPost.errors.publishFailed)
      } finally {
        dispatch({ type: 'setPublishing', isPublishing: false })
      }

      return
    }

    let createdPostId: string
    let createdPostOwnerId: string

    try {
      const fileIds = await uploadCreatePostImages(state, { dispatch })
      const description = state.caption.trim() || undefined
      const createdPost = await createPost({ description, fileIds })

      createdPostId = createdPost.id
      createdPostOwnerId = createdPost.ownerId
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : t.createPost.errors.publishFailed)
      dispatch({ type: 'setPublishing', isPublishing: false })

      return
    }

    const synchronization = synchronizeCreatedPost(createdPostId, createdPostOwnerId)

    dispatch({ type: 'reset' })
    onCloseAction?.()

    void synchronization.catch((error: unknown) => {
      console.error('[CreatePost] unexpected post-create synchronization failure', {
        postId: createdPostId,
        reason: error,
      })
    })
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

  useImperativeHandle(closeRequestRef, () => ({ requestClose: handleClose }))

  return (
    <section className={styles.root} data-size={flowSize} aria-label={t.createPost.flowAriaLabel}>
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
          isFilterExporting={isFilterExporting}
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
          onFilterExportingChange={handleFilterExportingChange}
          onCropGeometryChange={handleCropGeometryChange}
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
  const { t } = useI18n()

  return (
    <header className={styles.header}>
      <div className={styles.headerSlot} />

      <Title className={styles.title} level="h2">
        {t.createPost.steps.upload}
      </Title>

      <div className={styles.actionSlot}>
        {onCloseAction && (
          <IconButton
            className={styles.closeButton}
            icon={Close}
            label={t.createPost.actions.close}
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
  isFilterExporting: boolean
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
  isFilterExporting,
  isCropStep,
  onBack,
  onNext,
  onPublish,
  step,
}: WizardHeaderProps) {
  const { t } = useI18n()
  const isNextDisabled =
    !canGoNext || (isCropStep && isCropExporting) || (step === 'filters' && isFilterExporting)
  const isBackDisabled = isCropStep && isCropExporting
  return (
    <header className={styles.header}>
      <div className={styles.headerSlot}>
        {!isFirstStep && (
          <IconButton
            className={styles.backButton}
            disabled={isPublishing || isBackDisabled}
            icon={ArrowBackIcon}
            label={t.createPost.actions.back}
            onClick={onBack}
          />
        )}
      </div>

      <Title className={styles.title} level="h2">
        {t.createPost.steps[step]}
      </Title>

      <div className={styles.actionSlot}>
        {isLastStep ? (
          <Button
            className={styles.headerAction}
            disabled={!canPublish || isPublishing}
            loading={isPublishing}
            loadingText={t.createPost.actions.publishing}
            onClick={onPublish}
            type="button"
            variant="textButton"
          >
            {t.createPost.actions.publish}
          </Button>
        ) : (
          <Button
            className={styles.headerAction}
            disabled={!canGoNext || isPublishing || isNextDisabled}
            onClick={onNext}
            type="button"
            variant="textButton"
          >
            {t.createPost.actions.next}
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
  onFilterExportingChange: (isExporting: boolean) => void
  onAddImages: (images: CreatePostImage[]) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCaptionChange: (caption: string) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onCropGeometryChange: (imageId: string, geometry: CreatePostCropGeometry) => void
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
  onFilterExportingChange,
  onCropGeometryChange,
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
          onCropGeometryChange={onCropGeometryChange}
          onRemoveImage={onRemoveImage}
          onAddImages={onAddImages}
        />
      )

    case 'filters':
      return (
        <FiltersStep
          activeImage={activeImage}
          images={state.images}
          onExportingChange={onFilterExportingChange}
          onFilterChange={onFilterChange}
          onImageExported={onImageExported}
          onRemoveImage={onRemoveImage}
          onSetActiveImage={onSetActiveImage}
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
