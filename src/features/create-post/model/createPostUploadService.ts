import {
  completeUpload,
  initiateUploadBatch,
  retryUpload,
  type CompleteUploadPayload,
  type InitiateUploadInput,
  type InitiateUploadPayload,
  type RetryUploadPayload,
} from '../api'
import { selectUploadCandidates } from './createPostSelectors'
import type {
  CreatePostAction,
  CreatePostImage,
  CreatePostState,
  CreatePostUploadCandidate,
  CreatePostUploadPatch,
} from './createPostTypes'

type UploadCreatePostImagesOptions = {
  dispatch?: (action: CreatePostAction) => void
  fetcher?: typeof fetch
  now?: () => number
  retryImageId?: string
  wait?: (delayMs: number) => Promise<void>
}

type UploadRuntime = {
  attempt?: number
  expiresAt: string
  fileId: string
  uploadUrl: string
}

type PutOutcome = 'fresh-url' | 'non-retryable-failure' | 'retryable-failure' | 'success'
type CompletionOutcome = 'non-retryable-failure' | 'ready' | 'retryable-failure'
type CompletionResult = {
  fileId: string | null
  outcome: CompletionOutcome
}

const postImagePurpose = 'POST_IMAGE'
const initialServerUploadAttempt = 1
const sameUrlRetryDelays = [100, 250]
const maxServerUploadAttempt = 5

export async function uploadCreatePostImages(
  state: CreatePostState,
  options: UploadCreatePostImagesOptions = {},
): Promise<string[]> {
  const candidates = selectUploadCandidates(state)

  if (candidates.length !== state.images.length) {
    throw new Error('Every selected image must be exported before publishing.')
  }

  const imageById = new Map(state.images.map((image) => [image.id, image]))
  const candidatesToProcess = selectCandidatesToProcess(candidates, imageById, options.retryImageId)
  const newCandidates = candidatesToProcess.filter(
    (candidate) => !imageById.get(candidate.imageId)?.upload?.fileId,
  )
  const initiatedByImageId = await initiateNewCandidates(newCandidates, options.dispatch)
  const readyFileIdByImageId = new Map(
    state.images.flatMap((image) =>
      image.upload?.status === 'ready' && image.upload.fileId
        ? [[image.id, image.upload.fileId] as const]
        : [],
    ),
  )

  for (const candidate of candidatesToProcess) {
    const image = imageById.get(candidate.imageId)

    if (!image || image.upload?.status === 'ready') {
      continue
    }

    if (image.upload?.status === 'failed' && image.upload.retryable !== true) {
      continue
    }

    const runtime = createUploadRuntime(image, initiatedByImageId.get(candidate.imageId))
    const readyFileId = await processUploadCandidate(candidate, image, runtime, options)

    if (readyFileId) {
      readyFileIdByImageId.set(candidate.imageId, readyFileId)
    }
  }

  return state.images.flatMap((image) => {
    const fileId = readyFileIdByImageId.get(image.id)

    return fileId ? [fileId] : []
  })
}

function selectCandidatesToProcess(
  candidates: CreatePostUploadCandidate[],
  imageById: Map<string, CreatePostImage>,
  retryImageId: string | undefined,
): CreatePostUploadCandidate[] {
  if (!retryImageId) {
    return candidates.filter(
      (candidate) => imageById.get(candidate.imageId)?.upload?.status !== 'ready',
    )
  }

  const candidate = candidates.find(({ imageId }) => imageId === retryImageId)

  if (!candidate) {
    throw new Error(`Upload retry could not find image ${retryImageId}.`)
  }

  return [candidate]
}

async function initiateNewCandidates(
  candidates: CreatePostUploadCandidate[],
  dispatch: UploadCreatePostImagesOptions['dispatch'],
): Promise<Map<string, InitiateUploadPayload>> {
  if (candidates.length === 0) {
    return new Map()
  }

  const payload = await initiateUploadBatch(candidates.map(createInitiateUploadInput))
  const payloadByImageId = new Map(payload.map((item) => [item.clientUploadId, item]))
  const patches = candidates.map((candidate) => {
    const item = payloadByImageId.get(candidate.imageId)

    if (!item) {
      throw new Error(
        `Upload initialization did not return a descriptor for image ${candidate.imageId}.`,
      )
    }

    return createUploadingPatch(candidate.imageId, item)
  })

  dispatchPatches(dispatch, patches)

  return payloadByImageId
}

function createInitiateUploadInput(candidate: CreatePostUploadCandidate): InitiateUploadInput {
  return {
    clientUploadId: candidate.imageId,
    originalName: candidate.exportedFileInfo.name,
    purpose: postImagePurpose,
    mimeType: toUploadMimeType(candidate.exportedFile.type),
    size: candidate.exportedFile.size,
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
    attempt: initialServerUploadAttempt,
    retryable: undefined,
    retryMode: undefined,
    status: 'uploading',
  }
}

function createUploadRuntime(
  image: CreatePostImage,
  initiated: InitiateUploadPayload | undefined,
): UploadRuntime {
  if (initiated) {
    return {
      attempt: initialServerUploadAttempt,
      expiresAt: initiated.expiresAt,
      fileId: initiated.fileId,
      uploadUrl: initiated.uploadUrl,
    }
  }

  const { attempt, expiresAt, fileId, uploadUrl } = image.upload ?? {}

  if (!fileId || !uploadUrl || !expiresAt) {
    throw new Error(`Upload state is incomplete for image ${image.id}.`)
  }

  return { attempt, expiresAt, fileId, uploadUrl }
}

async function processUploadCandidate(
  candidate: CreatePostUploadCandidate,
  image: CreatePostImage,
  initialRuntime: UploadRuntime,
  options: UploadCreatePostImagesOptions,
): Promise<string | null> {
  let runtime = initialRuntime

  if (image.upload?.status === 'uploaded') {
    const completion = await completeCandidate(
      candidate.imageId,
      runtime.fileId,
      runtime.attempt,
      options.dispatch,
    )

    return completion.fileId
  }

  if (image.upload?.status === 'failed') {
    if (!canRequestFreshUploadUrl(runtime.attempt)) {
      markUploadFailed(candidate.imageId, runtime, false, undefined, options.dispatch)

      return null
    }

    const nextRuntime = await requestFreshUploadUrl(
      candidate.imageId,
      runtime,
      options.dispatch,
      options.now,
    )

    if (!nextRuntime) {
      return null
    }

    runtime = nextRuntime
  }

  while (true) {
    if (isExpired(runtime.expiresAt, options.now)) {
      if (!canRequestFreshUploadUrl(runtime.attempt)) {
        markUploadFailed(candidate.imageId, runtime, false, undefined, options.dispatch)

        return null
      }

      const nextRuntime = await requestFreshUploadUrl(
        candidate.imageId,
        runtime,
        options.dispatch,
        options.now,
      )

      if (!nextRuntime) {
        return null
      }

      runtime = nextRuntime
      continue
    }

    const putOutcome = await putWithSameUrlRetries(
      candidate.exportedFile,
      runtime.uploadUrl,
      runtime.expiresAt,
      options,
    )

    if (putOutcome === 'success') {
      dispatchPatches(options.dispatch, [
        {
          imageId: candidate.imageId,
          fileId: runtime.fileId,
          attempt: runtime.attempt,
          retryable: undefined,
          retryMode: undefined,
          status: 'uploaded',
        },
      ])

      const completion = await completeCandidate(
        candidate.imageId,
        runtime.fileId,
        runtime.attempt,
        options.dispatch,
      )

      return completion.fileId
    }

    if (putOutcome === 'fresh-url') {
      if (!canRequestFreshUploadUrl(runtime.attempt)) {
        markUploadFailed(candidate.imageId, runtime, false, undefined, options.dispatch)

        return null
      }

      const nextRuntime = await requestFreshUploadUrl(
        candidate.imageId,
        runtime,
        options.dispatch,
        options.now,
      )

      if (!nextRuntime) {
        return null
      }

      runtime = nextRuntime
      continue
    }

    const retryable =
      putOutcome === 'retryable-failure' && canRequestFreshUploadUrl(runtime.attempt)

    markUploadFailed(
      candidate.imageId,
      runtime,
      retryable,
      retryable ? 'new-url' : undefined,
      options.dispatch,
    )

    return null
  }
}

async function putWithSameUrlRetries(
  file: File,
  uploadUrl: string,
  expiresAt: string,
  options: UploadCreatePostImagesOptions,
): Promise<PutOutcome> {
  const fetcher = options.fetcher ?? fetch
  const wait = options.wait ?? waitForDelay

  for (let putAttempt = 0; putAttempt <= sameUrlRetryDelays.length; putAttempt += 1) {
    if (isExpired(expiresAt, options.now)) {
      return 'fresh-url'
    }

    try {
      const response = await fetcher(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (response.ok) {
        return 'success'
      }

      if (response.status === 403) {
        return 'fresh-url'
      }

      if (response.status !== 429 && response.status < 500) {
        return 'non-retryable-failure'
      }
    } catch {
      // Network failures use the same bounded presigned-URL retry path as 429 and 5xx.
    }

    const retryDelay = sameUrlRetryDelays[putAttempt]

    if (retryDelay === undefined) {
      return 'retryable-failure'
    }

    await wait(retryDelay)
  }

  return 'retryable-failure'
}

async function requestFreshUploadUrl(
  imageId: string,
  current: UploadRuntime,
  dispatch: UploadCreatePostImagesOptions['dispatch'],
  now: UploadCreatePostImagesOptions['now'],
): Promise<UploadRuntime | null> {
  if (!canRequestFreshUploadUrl(current.attempt)) {
    markUploadFailed(imageId, current, false, undefined, dispatch)
    throw new Error(`Upload retry limit reached for image ${imageId}.`)
  }

  let payload: RetryUploadPayload[]

  try {
    payload = await retryUpload([{ fileId: current.fileId }])
  } catch (error) {
    markUploadFailed(imageId, current, true, 'new-url', dispatch)
    throw error
  }

  const next = getRetryPayload(current, payload)

  if (!isUsableUploadRuntime(next, now)) {
    const retryable = canRequestFreshUploadUrl(next.attempt)

    markUploadFailed(
      imageId,
      next,
      retryable,
      retryable ? 'new-url' : undefined,
      dispatch,
      `Upload retry returned an unusable URL for image ${imageId}.`,
    )

    return null
  }

  dispatchPatches(dispatch, [
    {
      imageId,
      fileId: next.fileId,
      uploadUrl: next.uploadUrl,
      expiresAt: next.expiresAt,
      attempt: next.attempt,
      retryable: undefined,
      retryMode: undefined,
      status: 'uploading',
    },
  ])

  return next
}

function getRetryPayload(current: UploadRuntime, payload: RetryUploadPayload[]): UploadRuntime {
  const next = payload.find(({ fileId }) => fileId === current.fileId)

  if (!next) {
    throw new Error(`Upload retry did not return a descriptor for file ${current.fileId}.`)
  }

  if (next.attempt > maxServerUploadAttempt) {
    throw new Error(`Upload retry returned invalid attempt ${next.attempt}.`)
  }

  if (current.attempt !== undefined && next.attempt <= current.attempt) {
    throw new Error(`Upload retry did not advance the attempt for file ${current.fileId}.`)
  }

  return next
}

async function completeCandidate(
  imageId: string,
  fileId: string,
  attempt: number | undefined,
  dispatch: UploadCreatePostImagesOptions['dispatch'],
): Promise<CompletionResult> {
  const payload = await completeUpload([{ fileId }])
  const completed = getCompletionPayload(fileId, payload)

  if (completed.status === 'READY') {
    dispatchPatches(dispatch, [
      {
        imageId,
        fileId,
        attempt,
        retryable: false,
        retryMode: undefined,
        status: 'ready',
      },
    ])

    return { fileId, outcome: 'ready' }
  }

  const completionOutcome = getCompletionOutcome(completed)
  const retryable = completionOutcome === 'retryable-failure' && canRequestFreshUploadUrl(attempt)

  dispatchPatches(dispatch, [
    {
      imageId,
      fileId,
      attempt,
      retryable,
      retryMode: retryable ? 'new-url' : undefined,
      status: 'failed',
      error: completed.failedReason ?? `Upload completion returned ${completed.status}.`,
    },
  ])

  return { fileId: null, outcome: completionOutcome }
}

function getCompletionPayload(
  fileId: string,
  payload: CompleteUploadPayload[],
): CompleteUploadPayload {
  const completed = payload.find((item) => item.fileId === fileId)

  if (!completed) {
    throw new Error(`Upload completion did not return a status for file ${fileId}.`)
  }

  return completed
}

function getCompletionOutcome(payload: CompleteUploadPayload): CompletionOutcome {
  if (payload.status === 'READY') {
    return 'ready'
  }

  return payload.retryable ? 'retryable-failure' : 'non-retryable-failure'
}

function markUploadFailed(
  imageId: string,
  runtime: UploadRuntime,
  retryable: boolean,
  retryMode: CreatePostUploadPatch['retryMode'],
  dispatch: UploadCreatePostImagesOptions['dispatch'],
  error = `Storage upload failed for image ${imageId}.`,
): void {
  dispatchPatches(dispatch, [
    {
      imageId,
      fileId: runtime.fileId,
      uploadUrl: runtime.uploadUrl,
      expiresAt: runtime.expiresAt,
      attempt: runtime.attempt,
      retryable,
      retryMode,
      status: 'failed',
      error,
    },
  ])
}

function canRequestFreshUploadUrl(attempt: number | undefined): boolean {
  return attempt === undefined || attempt < maxServerUploadAttempt
}

function isExpired(expiresAt: string, now: UploadCreatePostImagesOptions['now']): boolean {
  const expiresAtTime = Date.parse(expiresAt)

  return Number.isFinite(expiresAtTime) && expiresAtTime <= (now?.() ?? Date.now())
}

function isUsableUploadRuntime(
  runtime: UploadRuntime,
  now: UploadCreatePostImagesOptions['now'],
): boolean {
  const expiresAtTime = Date.parse(runtime.expiresAt)

  return (
    runtime.uploadUrl.length > 0 &&
    Number.isFinite(expiresAtTime) &&
    expiresAtTime > (now?.() ?? Date.now())
  )
}

function dispatchPatches(
  dispatch: UploadCreatePostImagesOptions['dispatch'],
  patches: CreatePostUploadPatch[],
): void {
  dispatch?.({ type: 'applyUploadBatchState', patches })
}

function waitForDelay(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}
