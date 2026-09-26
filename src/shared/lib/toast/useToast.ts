'use client'

import { createContext, useContext } from 'react'

export type ToastVariant = 'error' | 'info' | 'success' | 'warning'

export type ToastInput =
  | string
  | {
      description?: string
      title: string
    }

export type ToastContextValue = {
  error: (input: ToastInput) => void
  info: (input: ToastInput) => void
  success: (input: ToastInput) => void
  warning: (input: ToastInput) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
