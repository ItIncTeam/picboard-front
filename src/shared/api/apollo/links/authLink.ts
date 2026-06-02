import { SetContextLink } from '@apollo/client/link/context'

import { getAccessToken } from '@/shared/lib/auth'

export const authLink = new SetContextLink((prevContext) => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    return prevContext
  }

  return {
    headers: {
      ...prevContext.headers,
      authorization: `Bearer ${accessToken}`,
    },
  }
})
