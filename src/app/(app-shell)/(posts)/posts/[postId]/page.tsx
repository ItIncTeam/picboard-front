import type { Metadata } from 'next'

import { generatePostDetailsMetadata, PostDetailsPage } from '@/views/post-details-page'

export async function generateMetadata({
  params,
}: PageProps<'/posts/[postId]'>): Promise<Metadata> {
  const { postId } = await params

  return generatePostDetailsMetadata(postId)
}

export default async function Page({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params

  return <PostDetailsPage postId={postId} />
}
