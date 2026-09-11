import { getPublicHomeQueryData } from '@/entities/post'

import { createPublicHomeDisplayModel, type PublicHomeDisplayModel } from '../model/publicHomeModel'

export async function getPublicHomeData(): Promise<PublicHomeDisplayModel> {
  const data = await getPublicHomeQueryData()

  return createPublicHomeDisplayModel(data)
}
