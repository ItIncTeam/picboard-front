'use client'

import { useReducer } from 'react'

import { Button } from '@/shared/ui/button'

import { CREATE_POST_STEPS } from '../lib/createPostConstants'
import { createPostInitialState, createPostReducer } from '@/features/create-post'
import type { CreatePostStep } from '@/features/create-post'
import { CropStep } from './CropStep'
import { FiltersStep } from './FiltersStep'
import { PublicationStep } from './PublicationStep'
import { UploadStep } from './UploadStep'
import styles from './create-post-flow.module.css'

const stepLabels: Record<CreatePostStep, string> = {
  upload: 'Upload',
  crop: 'Crop',
  filters: 'Filters',
  publication: 'Publication',
}

export function CreatePostFlow() {
  const [state, dispatch] = useReducer(createPostReducer, createPostInitialState)
  const currentStepIndex = CREATE_POST_STEPS.indexOf(state.step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === CREATE_POST_STEPS.length - 1

  return (
    <section className={styles.root} aria-label="Create post flow">
      <ol className={styles.steps} aria-label="Create post steps">
        {CREATE_POST_STEPS.map((step, index) => (
          <li className={styles.stepItem} data-active={step === state.step} key={step}>
            <span className={styles.stepIndex}>{index + 1}</span>
            <span>{stepLabels[step]}</span>
          </li>
        ))}
      </ol>

      <div className={styles.panel}>{renderStep(state.step)}</div>

      <div className={styles.actions}>
        <Button
          disabled={isFirstStep}
          onClick={() => dispatch({ type: 'goBack' })}
          type="button"
          variant="secondary"
        >
          Back
        </Button>

        {isLastStep ? (
          <Button disabled type="button">
            Publish
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: 'goNext' })} type="button">
            Next
          </Button>
        )}
      </div>
    </section>
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
