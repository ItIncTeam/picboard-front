import {
  completeUpload,
  initiateUploadBatch,
  type CompleteUploadInput,
  type CompleteUploadPayload,
  type InitiateUploadInput,
  type InitiateUploadPayload,
} from '../api'
import { selectUploadCandidates } from './createPostSelectors'
import type {
  CreatePostAction,
  CreatePostState,
  CreatePostUploadCandidate,
  CreatePostUploadPatch,
} from './createPostTypes'

type UploadCreatePostImagesOptions = {
  dispatch?: (action: CreatePostAction) => void
  fetcher?: typeof fetch
}

const postImagePurpose = 'POST_IMAGE'

export async function uploadCreatePostImages(
  state: CreatePostState,
  options: UploadCreatePostImagesOptions = {},
): Promise<string[]> {
  const candidates = selectUploadCandidates(state)

  if (candidates.length !== state.images.length) {
    throw new Error('Every selected image must be exported before publishing.')
  }

  const initiatePayload = await initiateUploadBatch(candidates.map(createInitiateUploadInput))
  const initiatePayloadByClientUploadId = new Map(
    initiatePayload.map((payload) => [payload.clientUploadId, payload]),
  )
  const uploadPatches = candidates.map((candidate) => {
    const payload = initiatePayloadByClientUploadId.get(candidate.imageId)

    if (!payload) {
      throw new Error(
        `Upload initialization did not return a descriptor for image ${candidate.imageId}.`,
      )
    }

    return createUploadingPatch(candidate.imageId, payload)
  })

  options.dispatch?.({ type: 'applyUploadBatchState', patches: uploadPatches })

  const uploadedFileIds = await uploadFilesToStorage(candidates, initiatePayloadByClientUploadId, {
    dispatch: options.dispatch,
    fetcher: options.fetcher,
  })
  const completePayload = await completeUpload(uploadedFileIds.map(createCompleteUploadInput))
  const readyFileIds = getReadyFileIdsInImageOrder(
    state,
    initiatePayloadByClientUploadId,
    completePayload,
  )

  options.dispatch?.({
    type: 'applyUploadBatchState',
    patches: readyFileIds.map(({ fileId, imageId }) => ({
      imageId,
      fileId,
      status: 'ready',
    })),
  })

  return readyFileIds.map(({ fileId }) => fileId)
}

function createInitiateUploadInput(candidate: CreatePostUploadCandidate): InitiateUploadInput {
  return {
    clientUploadId: candidate.imageId,
    originalName: candidate.fileInfo.name,
    purpose: postImagePurpose,
    mimeType: toUploadMimeType(candidate.fileInfo.type),
    size: candidate.fileInfo.size,
  }
}

function toUploadMimeType(mimeType: string): InitiateUploadInput['mimeType'] {
  if (mimeType === 'image/jpeg') {
    return 'JPEG'
  }

  if (mimeType === 'image/png') {
    return 'PNG'
  }

  throw new Error(`Unsupported image MIME type: ${mimeType}.`)
}

function createUploadingPatch(
  imageId: string,
  payload: InitiateUploadPayload,
): CreatePostUploadPatch {
  return {
    imageId,
    fileId: payload.fileId,
    uploadUrl: payload.uploadUrl,
    expiresAt: payload.expiresAt,
    status: 'uploading',
  }
}

async function uploadFilesToStorage(
  candidates: CreatePostUploadCandidate[],
  initiatePayloadByClientUploadId: Map<string, InitiateUploadPayload>,
  options: UploadCreatePostImagesOptions,
): Promise<string[]> {
  const fetcher = options.fetcher ?? fetch
  const uploadedFileIds: string[] = []

  for (const candidate of candidates) {
    const payload = initiatePayloadByClientUploadId.get(candidate.imageId)

    if (!payload) {
      throw new Error(
        `Upload initialization did not return a descriptor for image ${candidate.imageId}.`,
      )
    }

    const response = await fetcher(payload.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': candidate.file.type,
      },
      body: candidate.file,
    })

    if (!response.ok) {
      options.dispatch?.({
        type: 'applyUploadBatchState',
        patches: [
          {
            imageId: candidate.imageId,
            fileId: payload.fileId,
            status: 'failed',
            error: `Storage upload failed for image ${candidate.imageId}.`,
          },
        ],
      })

      throw new Error(`Storage upload failed for image ${candidate.imageId}.`)
    }

    uploadedFileIds.push(payload.fileId)
    options.dispatch?.({
      type: 'applyUploadBatchState',
      patches: [
        {
          imageId: candidate.imageId,
          fileId: payload.fileId,
          status: 'uploaded',
        },
      ],
    })
  }

  return uploadedFileIds
}

function createCompleteUploadInput(fileId: string): CompleteUploadInput {
  return {
    fileId,
  }
}

function getReadyFileIdsInImageOrder(
  state: CreatePostState,
  initiatePayloadByClientUploadId: Map<string, InitiateUploadPayload>,
  completePayload: CompleteUploadPayload[],
): Array<{ fileId: string; imageId: string }> {
  const completedByFileId = new Map(completePayload.map((payload) => [payload.fileId, payload]))

  return state.images.map((image) => {
    const initiatePayload = initiatePayloadByClientUploadId.get(image.id)

    if (!initiatePayload) {
      throw new Error(`Upload initialization did not return a descriptor for image ${image.id}.`)
    }

    const completedPayload = completedByFileId.get(initiatePayload.fileId)

    if (!completedPayload) {
      throw new Error(
        `Upload completion did not return a status for file ${initiatePayload.fileId}.`,
      )
    }

    if (completedPayload.status !== 'READY') {
      throw new Error(
        `Upload completion for file ${initiatePayload.fileId} returned ${completedPayload.status}.`,
      )
    }

    return {
      imageId: image.id,
      fileId: initiatePayload.fileId,
    }
  })
}
