export type ProfileSubmitFieldError = {
  code: string | null
  field: string
  message: string
}

type BackendFieldError = {
  field: string
  message: string
}

const nestedErrorKeys = ['errors', 'graphQLErrors'] as const
const nestedObjectKeys = ['originalError', 'networkError', 'result'] as const

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isBackendFieldError = (value: unknown): value is BackendFieldError => {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string' &&
    value.message.length > 0
  )
}

const getErrorCode = (
  value: Record<string, unknown>,
  fallbackCode: string | null,
): string | null => {
  const extensions = value.extensions

  if (!isRecord(extensions) || typeof extensions.code !== 'string') {
    return fallbackCode
  }

  return extensions.code
}

const getFieldErrors = (
  value: Record<string, unknown>,
  code: string | null,
): ProfileSubmitFieldError[] => {
  const extensions = value.extensions

  if (!isRecord(extensions) || !Array.isArray(extensions.errors)) {
    return []
  }

  return extensions.errors.flatMap((error) => {
    if (!isBackendFieldError(error)) {
      return []
    }

    return [{ code, field: error.field, message: error.message }]
  })
}

export function collectProfileSubmitFieldErrors(error: unknown): ProfileSubmitFieldError[] {
  const result: ProfileSubmitFieldError[] = []
  const visited = new WeakSet<object>()

  const visit = (value: unknown, inheritedCode: string | null): void => {
    if (!isRecord(value) || visited.has(value)) {
      return
    }

    visited.add(value)
    const code = getErrorCode(value, inheritedCode)
    result.push(...getFieldErrors(value, code))

    nestedErrorKeys.forEach((key) => {
      const nestedErrors = value[key]

      if (Array.isArray(nestedErrors)) {
        nestedErrors.forEach((nestedError) => visit(nestedError, code))
      }
    })

    nestedObjectKeys.forEach((key) => visit(value[key], code))
  }

  visit(error, null)

  return result
}
