import { getCachedInitialPost } from '@/views/post-details-page'
import { PostDetailsModal, PostDetailsUnavailable } from '@/widgets/post-details-modal'

export default async function Page({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params
  const data = await getCachedInitialPost(postId)

  if (!data) {
    return <PostDetailsUnavailable />
  }

  return <PostDetailsModal data={data} />
}
