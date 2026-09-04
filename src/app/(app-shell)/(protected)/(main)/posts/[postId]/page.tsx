import { PostDetailsPage } from '@/views/post-details-page'

export default async function Page({ params }: PageProps<'/posts/[postId]'>) {
  const { postId } = await params

  return <PostDetailsPage postId={postId} />
}
