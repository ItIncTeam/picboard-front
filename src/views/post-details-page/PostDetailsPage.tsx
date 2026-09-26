import { notFound } from 'next/navigation'

import { PostDetailsContent } from '@/widgets/post-details-modal'

import { getCachedInitialPost } from './api/loadInitialPost'

type PostDetailsPageProps = {
  postId: string
}

export async function PostDetailsPage({ postId }: PostDetailsPageProps) {
  const data = await getCachedInitialPost(postId)

  if (!data) {
    notFound()
  }

  return <PostDetailsContent data={data} key={data.baselineKey} />
}
