'use client'

import * as ToastPrimitive from '@radix-ui/react-toast'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastVariant,
} from '@/shared/lib/toast'
import { useI18n } from '@/shared/lib/i18n'

import styles from './toast.module.css'

type ToastItem = {
  description?: string
  id: string
  title: string
  variant: ToastVariant
}

type ToastProviderProps = Readonly<{
  children: ReactNode
}>

const maxVisibleToasts = 3
const toastDurationMs = 4500

const resolveToastInput = (
  input: ToastInput,
  variant: ToastVariant,
  variantTitles: Record<ToastVariant, string>,
): Omit<ToastItem, 'id' | 'variant'> => {
  if (typeof input === 'string') {
    return {
      title: variantTitles[variant],
      description: input,
    }
  }

  return input
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const { t } = useI18n()
  const nextIdRef = useRef(0)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const variantTitles = useMemo<Record<ToastVariant, string>>(
    () => ({
      error: t.ui.toast.error,
      info: t.ui.toast.info,
      success: t.ui.toast.success,
      warning: t.ui.toast.warning,
    }),
    [t.ui.toast.error, t.ui.toast.info, t.ui.toast.success, t.ui.toast.warning],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (variant: ToastVariant, input: ToastInput) => {
      const nextToast = {
        id: String(nextIdRef.current),
        variant,
        ...resolveToastInput(input, variant, variantTitles),
      }

      nextIdRef.current += 1

      setToasts((currentToasts) => [nextToast, ...currentToasts].slice(0, maxVisibleToasts))
    },
    [variantTitles],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      error: (input) => showToast('error', input),
      info: (input) => showToast('info', input),
      success: (input) => showToast('success', input),
      warning: (input) => showToast('warning', input),
    }),
    [showToast],
  )

  return (
    <ToastContext value={value}>
      <ToastPrimitive.Provider duration={toastDurationMs} swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            className={styles.root}
            data-variant={toast.variant}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                dismissToast(toast.id)
              }
            }}
          >
            <ToastPrimitive.Title className={styles.title}>{toast.title}</ToastPrimitive.Title>
            {toast.description ? (
              <ToastPrimitive.Description className={styles.description}>
                {toast.description}
              </ToastPrimitive.Description>
            ) : null}
            <ToastPrimitive.Close className={styles.close} aria-label={t.ui.closeNotification}>
              ×
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className={styles.viewport} />
      </ToastPrimitive.Provider>
    </ToastContext>
  )
}
