import type { CurrentUser } from '@/entities/user/current-user'

export type SessionStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

export type SessionState = {
  status: SessionStatus
  user: CurrentUser | null
}

export type SessionContextValue = SessionState & {
  authenticateWithCurrentToken: () => Promise<void>
  createCurrentUserSynchronizer: () => (user: CurrentUser) => boolean
  isAuthenticated: boolean
  isBootstrapping: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  setAnonymousSession: () => void
}
