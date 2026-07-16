'use client'

import { CreatePostCloseConfirm } from '@/features/create-post/ui/CreatePostCloseConfirm'
import { useReducer, useState } from 'react'

import { ArrowBackIcon, Close } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Text } from '@/shared/ui/typography'
import { Title } from '@/shared/ui/typography'

import { CREATE_POST_STEPS } from '../lib/createPostConstants'
import { createPost } from '../api/createPostApi'
import { useCreatePostExportedUrlCleanup } from '../lib/useCreatePostExportedUrlCleanup'
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
import { CropStep } from './CropStep'
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

  useCreatePostPreviewUrlCleanup(state.images)
  useCreatePostExportedUrlCleanup(state.images)

  const currentStepIndex = CREATE_POST_STEPS.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === CREATE_POST_STEPS.length - 1
  const canGoNext = selectCanGoNext(state)
  const canPublish = selectCanPublish(state)
  const activeImage = selectActiveImage(state)
  const isUploadHeader = state.step === 'upload' && state.images.length === 0
  const flowSize = state.step === 'filters' || state.step === 'publication' ? 'wide' : 'compact'

  const handleAddImages = (images: CreatePostImage[]) => {
    dispatch({ type: 'addImages', images })
  }

  const handleRemoveImage = (imageId: string) => {
    dispatch({ type: 'removeImage', imageId })
  }

  const handleSetActiveImage = (imageId: string | null) => {
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

  const handleCaptionChange = (caption: string) => {
    dispatch({ type: 'setCaption', caption })
  }

  const handlePublish = async () => {
    if (!canPublish) {
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
    if (selectHasCreatePostUnsavedData(state)) {
      setIsCloseConfirmOpen(true)

      return
    }
    onCloseAction?.()
  }

  const handleDiscard = () => {
    dispatch({ type: 'reset' })
    onCloseAction?.()
  }
  return (
    <section className={styles.root} data-size={flowSize} aria-label="Create post flow">
      {isUploadHeader
        ? renderUploadHeader(handleClose)
        : renderWizardHeader({
            canGoNext,
            canPublish,
            isFirstStep,
            isLastStep,
            isPublishing: state.isPublishing,
            onBack: () => dispatch({ type: 'goBack' }),
            onNext: () => dispatch({ type: 'goNext' }),
            onPublish: handlePublish,
            step: state.step,
          })}

      <div className={styles.body}>
        {renderStep({
          activeImage,
          onAddImages: handleAddImages,
          onAspectRatioChange: handleAspectRatioChange,
          onCaptionChange: handleCaptionChange,
          onFilterChange: handleFilterChange,
          onImageExported: handleImageExported,
          onRemoveImage: handleRemoveImage,
          onSetActiveImage: handleSetActiveImage,
          state,
        })}
      </div>
      {publishError && (
        <Text as="p" className={styles.error} role="alert" size="sm">
          {publishError}
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

function renderUploadHeader(onCloseAction?: () => void) {
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
  onBack: () => void
  onNext: () => void
  onPublish: () => void | Promise<void>
  step: CreatePostStep
}

function renderWizardHeader({
  canGoNext,
  canPublish,
  isFirstStep,
  isLastStep,
  isPublishing,
  onBack,
  onNext,
  onPublish,
  step,
}: WizardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerSlot}>
        {!isFirstStep && (
          <IconButton
            className={styles.backButton}
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
            disabled={!canPublish}
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
            disabled={!canGoNext}
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
  onAddImages: (images: CreatePostImage[]) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCaptionChange: (caption: string) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
  state: CreatePostState
}

function renderStep({
  activeImage,
  onAddImages,
  onAspectRatioChange,
  onCaptionChange,
  onFilterChange,
  onImageExported,
  onRemoveImage,
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
          images={state.images}
          onSetActiveImage={onSetActiveImage}
          onAspectRatioChange={onAspectRatioChange}
          onImageExported={onImageExported}
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
          onCaptionChange={onCaptionChange}
        />
      )
  }
}
