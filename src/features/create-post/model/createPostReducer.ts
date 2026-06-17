import { CREATE_POST_INITIAL_STEP, CREATE_POST_STEPS } from '../lib/createPostConstants'
import type { CreatePostAction, CreatePostState, CreatePostStep } from './createPostTypes'

export const createPostInitialState: CreatePostState = {
  step: CREATE_POST_INITIAL_STEP,
  images: [],
  activeImageId: null,
  caption: '',
  hasUnsavedData: false,
  isPublishing: false,
}

export function createPostReducer(
  state: CreatePostState,
  action: CreatePostAction,
): CreatePostState {
  switch (action.type) {
    case 'goToStep':
      return {
        ...state,
        step: action.step,
      }

    case 'goBack':
      return {
        ...state,
        step: getAdjacentStep(state.step, -1),
      }

    case 'goNext':
      return {
        ...state,
        step: getAdjacentStep(state.step, 1),
      }

    case 'reset':
      return createPostInitialState

    default:
      return state
  }
}

function getAdjacentStep(currentStep: CreatePostStep, offset: -1 | 1): CreatePostStep {
  const currentIndex = CREATE_POST_STEPS.indexOf(currentStep)
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), CREATE_POST_STEPS.length - 1)

  return CREATE_POST_STEPS[nextIndex]
}
