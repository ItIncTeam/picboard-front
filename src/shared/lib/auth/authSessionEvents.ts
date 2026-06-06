type AuthSessionExpiredListener = () => void

const authSessionExpiredListeners = new Set<AuthSessionExpiredListener>()

export const subscribeAuthSessionExpired = (listener: AuthSessionExpiredListener): (() => void) => {
  authSessionExpiredListeners.add(listener)

  return () => {
    authSessionExpiredListeners.delete(listener)
  }
}

export const notifyAuthSessionExpired = (): void => {
  authSessionExpiredListeners.forEach((listener) => {
    listener()
  })
}
