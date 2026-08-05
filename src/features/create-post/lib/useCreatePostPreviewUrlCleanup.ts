import { useEffect, useRef } from 'react'

import type { CreatePostImage } from '../model/createPostTypes'

/**
 * Owns preview and exported object URLs for one CreatePostFlow lifecycle.
 * Final unmount revokes every remaining URL; a later flow instance must create new URLs instead
 * of reusing values owned by the unmounted instance.
 */
export function useCreatePostPreviewUrlCleanup(images: CreatePostImage[]) {
  const cleanupGenerationRef = useRef(0)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextObjectUrls = new Set<string>()

    images.forEach((image) => {
      if (image.previewUrl) {
        nextObjectUrls.add(image.previewUrl)
      }

      if (image.exported?.objectUrl) {
        nextObjectUrls.add(image.exported.objectUrl)
      }
    })

    objectUrlsRef.current.forEach((objectUrl) => {
      if (!nextObjectUrls.has(objectUrl)) {
        URL.revokeObjectURL(objectUrl)
      }
    })

    objectUrlsRef.current = nextObjectUrls
  }, [images])

  useEffect(() => {
    const cleanupGeneration = cleanupGenerationRef.current + 1
    cleanupGenerationRef.current = cleanupGeneration

    return () => {
      queueMicrotask(() => {
        if (cleanupGenerationRef.current !== cleanupGeneration) {
          return
        }

        objectUrlsRef.current.forEach((objectUrl) => {
          URL.revokeObjectURL(objectUrl)
        })

        objectUrlsRef.current.clear()
      })
    }
  }, [])
}
