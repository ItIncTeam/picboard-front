import { CREATE_POST_INITIAL_STEP, CREATE_POST_STEPS } from '../lib/createPostConstants'
import type {
  CreatePostAction,
  CreatePostCropCoordinates,
  CreatePostCropGeometry,
  CreatePostState,
  CreatePostStep,
} from './createPostTypes'

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

    case 'addImages': {
      const firstAddedImage = action.images[0]

      return {
        ...state,
        images: [...state.images, ...action.images],
        activeImageId: state.activeImageId ?? firstAddedImage?.id ?? null,
        hasUnsavedData: true,
      }
    }

    case 'removeImage': {
      const nextImages = state.images.filter((image) => image.id !== action.imageId)

      if (nextImages.length === state.images.length) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        activeImageId:
          state.activeImageId === action.imageId
            ? (nextImages[0]?.id ?? null)
            : state.activeImageId,
        hasUnsavedData: true,
      }
    }

    case 'setActiveImage':
      return {
        ...state,
        activeImageId: action.imageId,
      }

    case 'setCaption':
      return {
        ...state,
        caption: action.caption,
        hasUnsavedData: true,
      }

    case 'setImageAspectRatio': {
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        if (image.id !== action.imageId || image.aspectRatio === action.aspectRatio) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          aspectRatio: action.aspectRatio,
          cropGeometry: undefined,
          cropped: undefined,
          exported: undefined,
          upload: undefined,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        hasUnsavedData: true,
      }
    }

    case 'setImageCropGeometry': {
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        if (
          image.id !== action.imageId ||
          areCropGeometriesEqual(image.cropGeometry, action.geometry)
        ) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          cropGeometry: action.geometry,
          cropped: undefined,
          exported: undefined,
          upload: undefined,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        hasUnsavedData: true,
      }
    }

    case 'setImageCropped': {
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        if (image.id !== action.imageId) {
          return image
        }

        const isSameCrop =
          image.cropped === action.cropped &&
          areCropGeometriesEqual(image.cropGeometry, action.geometry)

        if (isSameCrop) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          cropGeometry: action.geometry,
          cropped: action.cropped,
          exported: image.filter === 'normal' ? action.cropped : undefined,
          upload: undefined,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        hasUnsavedData: true,
      }
    }

    case 'setImageFilter': {
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        if (image.id !== action.imageId || image.filter === action.filter) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          filter: action.filter,
          exported: undefined,
          upload: undefined,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        hasUnsavedData: true,
      }
    }

    case 'setImageExported': {
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        if (image.id !== action.imageId) {
          return image
        }

        if (image.exported === action.exported) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          exported: action.exported,
          upload: undefined,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
        hasUnsavedData: true,
      }
    }

    case 'setPublishing': {
      if (state.isPublishing === action.isPublishing) {
        return state
      }

      return {
        ...state,
        isPublishing: action.isPublishing,
      }
    }

    case 'applyUploadBatchState': {
      if (action.patches.length === 0) {
        return state
      }

      const patchesByImageId = new Map(action.patches.map((patch) => [patch.imageId, patch]))
      let hasChanged = false

      const nextImages = state.images.map((image) => {
        const patch = patchesByImageId.get(image.id)

        if (!patch) {
          return image
        }

        const { imageId: _imageId, ...uploadPatch } = patch

        const nextUpload = {
          status: image.upload?.status ?? uploadPatch.status ?? 'idle',
          ...image.upload,
          ...uploadPatch,
        }

        if (nextUpload.status !== 'failed' && !('error' in uploadPatch)) {
          delete nextUpload.error
        }

        if (
          image.upload?.fileId === nextUpload.fileId &&
          image.upload?.uploadUrl === nextUpload.uploadUrl &&
          image.upload?.expiresAt === nextUpload.expiresAt &&
          image.upload?.status === nextUpload.status &&
          image.upload?.error === nextUpload.error
        ) {
          return image
        }

        hasChanged = true

        return {
          ...image,
          upload: nextUpload,
        }
      })

      if (!hasChanged) {
        return state
      }

      return {
        ...state,
        images: nextImages,
      }
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

function areCropCoordinatesEqual(
  first: CreatePostCropCoordinates | null | undefined,
  second: CreatePostCropCoordinates | null | undefined,
): boolean {
  if (first === second) {
    return true
  }

  if (!first || !second) {
    return false
  }

  return (
    first.height === second.height &&
    first.left === second.left &&
    first.top === second.top &&
    first.width === second.width
  )
}

function areCropGeometriesEqual(
  first: CreatePostCropGeometry | undefined,
  second: CreatePostCropGeometry,
): boolean {
  return (
    areCropCoordinatesEqual(first?.coordinates, second.coordinates) &&
    areCropCoordinatesEqual(first?.visibleArea, second.visibleArea) &&
    first?.transforms.rotate === second.transforms.rotate &&
    first?.transforms.flip.horizontal === second.transforms.flip.horizontal &&
    first?.transforms.flip.vertical === second.transforms.flip.vertical
  )
}
