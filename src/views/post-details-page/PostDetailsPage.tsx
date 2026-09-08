import { notFound } from 'next/navigation'

import { getCachedInitialPost } from './api/loadInitialPost'
import { PostDetailsContent } from './PostDetailsContent'

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
