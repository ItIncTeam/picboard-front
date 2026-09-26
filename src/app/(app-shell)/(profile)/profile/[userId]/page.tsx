import { ProfilePage } from '@/views/profile-page'

export default async function Page({ params }: PageProps<'/profile/[userId]'>) {
  const { userId } = await params

  return <ProfilePage userId={userId} />
}
