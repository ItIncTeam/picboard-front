import { getPublicHomeData, PublicHomePage } from '@/views/public-home-page'
import { HomeShell } from '@/widgets/home-shell'

export const revalidate = 60

export default async function Page() {
  const publicHomeData = await getPublicHomeData()

  return (
    <HomeShell>
      <PublicHomePage posts={publicHomeData.posts} usersCount={publicHomeData.usersCount} />
    </HomeShell>
  )
}
