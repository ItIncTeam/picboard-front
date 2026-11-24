import {
  completeAvatarUpload,
  initiateAvatarUpload,
  retryAvatarUpload,
  type AvatarUploadMimeType,
  type RetryAvatarUploadPayload,
} from '../api/avatarUploadApi'
import { MAX_AVATAR_FILE_SIZE_BYTES } from './avatarDraft'

type UploadAvatarOptions = {
  clientUploadId?: string
  fetcher?: typeof fetch
  now?: () => number
  wait?: (delayMs: number) => Promise<void>
}

type UploadRuntime = {
  attempt: number
  expiresAt: string
  fileId: string
  uploadUrl: string
}

const sameUrlRetryDelays = [100, 250]
const maxServerUploadAttempt = 5

export async function uploadAvatar(file: File, options: UploadAvatarOptions = {}): Promise<string> {
  const mimeType = toAvatarUploadMimeType(file.type)

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error('Avatar upload exceeds the maximum file size.')
  }

  const clientUploadId = options.clientUploadId ?? crypto.randomUUID()
  const initiated = await initiateAvatarUpload([
    {
      clientUploadId,
      mimeType,
      originalName: file.name,
      purpose: 'AVATAR',
      size: file.size,
    },
  ])
  const initial = initiated.find((item) => item.clientUploadId === clientUploadId)

  if (!initial) {
    throw new Error('Avatar upload initialization did not return an upload descriptor.')
  }

  let runtime: UploadRuntime = { ...initial, attempt: 1 }

  while (true) {
    if (isExpired(runtime.expiresAt, options.now)) {
      runtime = await getFreshUploadRuntime(runtime)
      continue
    }

    const result = await putAvatar(file, runtime, options)

    if (result === 'fresh-url') {
      runtime = await getFreshUploadRuntime(runtime)
      continue
    }

    if (result === 'failed') {
      throw new Error('Avatar storage upload failed. Please try again.')
    }

    const completed = await completeAvatarUpload([{ fileId: runtime.fileId }])
    const payload = completed.find((item) => item.fileId === runtime.fileId)

    if (!payload) {
      throw new Error('Avatar upload completion did not return a status.')
    }

    if (payload.status === 'READY') {
      return runtime.fileId
    }

    if (!payload.retryable || runtime.attempt >= maxServerUploadAttempt) {
      throw new Error(payload.failedReason ?? `Avatar upload returned ${payload.status}.`)
    }

    runtime = await getFreshUploadRuntime(runtime)
  }
}

function toAvatarUploadMimeType(mimeType: string): AvatarUploadMimeType {
  if (mimeType === 'image/jpeg') {
    return 'JPEG'
  }

  if (mimeType === 'image/png') {
    return 'PNG'
  }

  throw new Error(`Unsupported avatar MIME type: ${mimeType}.`)
}

async function putAvatar(
  file: File,
  runtime: UploadRuntime,
  options: UploadAvatarOptions,
): Promise<'failed' | 'fresh-url' | 'success'> {
  const fetcher = options.fetcher ?? fetch
  const wait = options.wait ?? waitForDelay

  for (let attempt = 0; attempt <= sameUrlRetryDelays.length; attempt += 1) {
    if (isExpired(runtime.expiresAt, options.now)) {
      return 'fresh-url'
    }

    try {
      const response = await fetcher(runtime.uploadUrl, {
        body: file,
        headers: { 'Content-Type': file.type },
        method: 'PUT',
      })

      if (response.ok) {
        return 'success'
      }

      if (response.status === 403) {
        return 'fresh-url'
      }

      if (response.status !== 429 && response.status < 500) {
        return 'failed'
      }
    } catch {
      // Network failures share the bounded retry policy for the current presigned URL.
    }

    const delay = sameUrlRetryDelays[attempt]

    if (delay === undefined) {
      return 'failed'
    }

    await wait(delay)
  }

  return 'failed'
}

async function getFreshUploadRuntime(current: UploadRuntime): Promise<UploadRuntime> {
  if (current.attempt >= maxServerUploadAttempt) {
    throw new Error('Avatar upload retry limit reached.')
  }

  const retried = await retryAvatarUpload([{ fileId: current.fileId }])
  const next = retried.find((item) => item.fileId === current.fileId)

  if (!next) {
    throw new Error('Avatar upload retry did not return an upload descriptor.')
  }

  return validateRetryPayload(current, next)
}

function validateRetryPayload(
  current: UploadRuntime,
  next: RetryAvatarUploadPayload,
): UploadRuntime {
  if (next.attempt <= current.attempt || next.attempt > maxServerUploadAttempt) {
    throw new Error('Avatar upload retry returned an invalid attempt.')
  }

  return next
}

function isExpired(expiresAt: string, now: UploadAvatarOptions['now']): boolean {
  const time = Date.parse(expiresAt)

  return Number.isFinite(time) && time <= (now?.() ?? Date.now())
}

function waitForDelay(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}
