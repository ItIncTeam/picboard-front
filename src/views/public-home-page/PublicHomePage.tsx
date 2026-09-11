import { getPublicHomeData } from './api/getPublicHomeData'
import { PublicHomeContent } from './PublicHomeContent'

export async function PublicHomePage() {
  const data = await getPublicHomeData()

  return <PublicHomeContent data={data} />
}

export { PublicHomeContent } from './PublicHomeContent'
