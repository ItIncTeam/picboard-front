'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { writeCurrentUserCache, type CurrentUser } from '@/entities/user/current-user'
import {
  clearAccessToken,
  getAccessToken,
  getTokenVersion,
  setAccessToken,
  subscribeAuthSessionExpired,
} from '@/shared/lib/auth'

import { getMe, logout as requestLogout, refreshToken } from '../api'
import type { SessionContextValue, SessionState } from './types'

type SessionProviderProps = Readonly<{
  children: ReactNode
}>

const initialSessionState: SessionState = {
  status: 'bootstrapping',
  user: null,
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionState>(initialSessionState)
  const sessionSnapshotRef = useRef({ state: initialSessionState, requestId: 0 })
  const didBootstrapRef = useRef(false)
  const isMountedRef = useRef(false)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)
  const sessionRequestIdRef = useRef(0)

  const commitSession = useCallback((nextSession: SessionState) => {
    sessionSnapshotRef.current = { state: nextSession, requestId: sessionRequestIdRef.current }
    setSession(nextSession)
  }, [])

  const setAnonymousSession = useCallback(() => {
    sessionRequestIdRef.current += 1
    clearAccessToken()

    commitSession({
      status: 'anonymous',
      user: null,
    })
  }, [commitSession])

  const authenticateWithCurrentToken = useCallback(async () => {
    const requestId = ++sessionRequestIdRef.current

    try {
      const user = await getMe()

      if (!isMountedRef.current || sessionRequestIdRef.current !== requestId) {
        return
      }

      commitSession({
        status: 'authenticated',
        user,
      })
    } catch (error) {
      if (isMountedRef.current && sessionRequestIdRef.current === requestId) {
        setAnonymousSession()
      }

      throw error
    }
  }, [commitSession, setAnonymousSession])

  const refreshSession = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const requestId = ++sessionRequestIdRef.current

    refreshPromiseRef.current = (async () => {
      try {
        const { accessToken } = await refreshToken()

        if (!isMountedRef.current || sessionRequestIdRef.current !== requestId) {
          return
        }

        setAccessToken(accessToken)

        const user = await getMe()

        if (!isMountedRef.current || sessionRequestIdRef.current !== requestId) {
          return
        }

        commitSession({
          status: 'authenticated',
          user,
        })
      } catch {
        if (!isMountedRef.current || sessionRequestIdRef.current !== requestId) {
          return
        }

        setAnonymousSession()
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    return refreshPromiseRef.current
  }, [commitSession, setAnonymousSession])

  const createCurrentUserSynchronizer = useCallback((): ((user: CurrentUser) => boolean) => {
    const snapshot = sessionSnapshotRef.current

    if (
      snapshot.state.status !== 'authenticated' ||
      snapshot.requestId !== sessionRequestIdRef.current ||
      !getAccessToken()
    ) {
      return () => false
    }

    const tokenVersion = getTokenVersion()

    return (user: CurrentUser): boolean => {
      if (
        !isMountedRef.current ||
        sessionSnapshotRef.current !== snapshot ||
        sessionRequestIdRef.current !== snapshot.requestId ||
        getTokenVersion() !== tokenVersion ||
        user.id !== snapshot.state.user?.id
      ) {
        return false
      }

      writeCurrentUserCache(user)
      commitSession({ status: 'authenticated', user })
      return true
    }
  }, [commitSession])

  const logout = useCallback(async () => {
    const requestId = ++sessionRequestIdRef.current

    try {
      await requestLogout()
    } catch {
      // Local logout must still clear memory-only auth state if the backend call fails.
    } finally {
      if (isMountedRef.current && sessionRequestIdRef.current === requestId) {
        setAnonymousSession()
      }
    }
  }, [setAnonymousSession])

  useEffect(() => {
    return subscribeAuthSessionExpired(() => {
      setAnonymousSession()
    })
  }, [setAnonymousSession])

  useEffect(() => {
    isMountedRef.current = true

    if (!didBootstrapRef.current) {
      didBootstrapRef.current = true
      void refreshSession()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [refreshSession])

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      authenticateWithCurrentToken,
      createCurrentUserSynchronizer,
      isAuthenticated: session.status === 'authenticated',
      isBootstrapping: session.status === 'bootstrapping',
      logout,
      refreshSession,
      setAnonymousSession,
    }),
    [
      authenticateWithCurrentToken,
      createCurrentUserSynchronizer,
      logout,
      refreshSession,
      session,
      setAnonymousSession,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
