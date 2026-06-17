'use client'

import { useReducer } from 'react'

import { ArrowBackIcon, Close } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Title } from '@/shared/ui/typography'

import { CREATE_POST_STEPS } from '../lib/createPostConstants'
import { createPostInitialState, createPostReducer } from '../model/createPostReducer'
import { selectCanGoNext, selectCanPublish } from '../model/createPostSelectors'
import type { CreatePostState, CreatePostStep } from '../model/createPostTypes'
import { CropStep } from './CropStep'
import { FiltersStep } from './FiltersStep'
import { PublicationStep } from './PublicationStep'
import { UploadStep } from './UploadStep'
import styles from './create-post-flow.module.css'

type CreatePostFlowProps = {
  initialState?: CreatePostState
  onCloseAction?: () => void
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
}: CreatePostFlowProps) {
  const [state, dispatch] = useReducer(createPostReducer, initialState)
  const currentStepIndex = CREATE_POST_STEPS.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === CREATE_POST_STEPS.length - 1
  const canGoNext = selectCanGoNext(state)
  const canPublish = selectCanPublish(state)
  const isUploadHeader = state.step === 'upload' && state.images.length === 0
  const flowSize = state.step === 'filters' || state.step === 'publication' ? 'wide' : 'compact'

  return (
    <section className={styles.root} data-size={flowSize} aria-label="Create post flow">
      {isUploadHeader
        ? renderUploadHeader(onCloseAction)
        : renderWizardHeader({
            canGoNext,
            canPublish,
            isFirstStep,
            isLastStep,
            onBack: () => dispatch({ type: 'goBack' }),
            onNext: () => dispatch({ type: 'goNext' }),
            step: state.step,
          })}

      <div className={styles.body}>{renderStep(state.step)}</div>
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
  onBack: () => void
  onNext: () => void
  step: CreatePostStep
}

function renderWizardHeader({
  canGoNext,
  canPublish,
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
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

function renderStep(step: CreatePostStep) {
  switch (step) {
    case 'upload':
      return <UploadStep />

    case 'crop':
      return <CropStep />

    case 'filters':
      return <FiltersStep />

    case 'publication':
      return <PublicationStep />
  }
}
