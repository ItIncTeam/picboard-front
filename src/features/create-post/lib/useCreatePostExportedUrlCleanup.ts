import { useEffect, useRef } from 'react'

import type { CreatePostImage } from '../model/createPostTypes'

export function useCreatePostExportedUrlCleanup(images: CreatePostImage[]) {
  const exportedUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextExportedUrls = new Set(
      images
        .flatMap((image) => [
          image.exported?.objectUrl,
          image.filterBase?.objectUrl === image.previewUrl
            ? undefined
            : image.filterBase?.objectUrl,
        ])
        .filter((objectUrl): objectUrl is string => Boolean(objectUrl)),
    )

    exportedUrlsRef.current.forEach((objectUrl) => {
      if (!nextExportedUrls.has(objectUrl)) {
        URL.revokeObjectURL(objectUrl)
      }
    })

    exportedUrlsRef.current = nextExportedUrls
  }, [images])

  useEffect(() => {
    return () => {
      exportedUrlsRef.current.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl)
      })

      exportedUrlsRef.current.clear()
    }
  }, [])
}
