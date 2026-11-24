import {
  ACCEPTED_AVATAR_MIME_TYPES,
  MAX_AVATAR_FILE_SIZE_BYTES,
  type AvatarCropSelection,
} from './avatarDraft'

export class AvatarExportError extends Error {}

export async function exportAvatarCrop(selection: AvatarCropSelection): Promise<File> {
  const { source } = selection

  if (
    !ACCEPTED_AVATAR_MIME_TYPES.includes(source.type as (typeof ACCEPTED_AVATAR_MIME_TYPES)[number])
  ) {
    throw new AvatarExportError('Unsupported avatar MIME type.')
  }

  const bitmap = await createImageBitmap(source)

  try {
    const size = Math.round(selection.width)

    if (size <= 0) {
      throw new AvatarExportError('Avatar crop has invalid dimensions.')
    }

    const canvas = document.createElement('canvas')
    canvas.height = size
    canvas.width = size

    const context = canvas.getContext('2d')

    if (!context) {
      throw new AvatarExportError('Avatar crop could not create a canvas context.')
    }

    context.drawImage(
      bitmap,
      selection.left,
      selection.top,
      selection.width,
      selection.height,
      0,
      0,
      size,
      size,
    )

    const blob = await canvasToBlob(canvas, source.type)
    const file = new File([blob], source.name, { type: source.type })

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      throw new AvatarExportError('Avatar export exceeds the maximum file size.')
    }

    return file
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)

        return
      }

      reject(new AvatarExportError('Avatar crop could not create an image file.'))
    }, type)
  })
}
