import { useEffect, useRef } from 'react'

import type { CreatePostImage } from '../model/createPostTypes'

export function useCreatePostPreviewUrlCleanup(images: CreatePostImage[]) {
  const previewUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextPreviewUrls = new Set(
      images
        .map((image) => image.previewUrl)
        .filter((previewUrl): previewUrl is string => Boolean(previewUrl)),
    )

    previewUrlsRef.current.forEach((previewUrl) => {
      if (!nextPreviewUrls.has(previewUrl)) {
        URL.revokeObjectURL(previewUrl)
      }
    })

    previewUrlsRef.current = nextPreviewUrls
  }, [images])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl)
      })

      previewUrlsRef.current.clear()
    }
  }, [])
}
