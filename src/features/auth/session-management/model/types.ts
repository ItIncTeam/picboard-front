import type { CurrentUser } from '../api'

export type SessionStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

export type SessionState = {
  status: SessionStatus
  user: CurrentUser | null
}

export type SessionContextValue = SessionState & {
  authenticateWithCurrentToken: () => Promise<void>
  isAuthenticated: boolean
  isBootstrapping: boolean
  refreshSession: () => Promise<void>
  setAnonymousSession: () => void
}
