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

import { clearAccessToken, setAccessToken, subscribeAuthSessionExpired } from '@/shared/lib/auth'

import { getMe, refreshToken } from '../api'
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
  const didBootstrapRef = useRef(false)
  const isMountedRef = useRef(false)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)
  const sessionRequestIdRef = useRef(0)

  const setAnonymousSession = useCallback(() => {
    clearAccessToken()

    setSession({
      status: 'anonymous',
      user: null,
    })
  }, [])

  const authenticateWithCurrentToken = useCallback(async () => {
    const requestId = ++sessionRequestIdRef.current

    try {
      const user = await getMe()

      if (!isMountedRef.current || sessionRequestIdRef.current !== requestId) {
        return
      }

      setSession({
        status: 'authenticated',
        user,
      })
    } catch (error) {
      if (isMountedRef.current && sessionRequestIdRef.current === requestId) {
        setAnonymousSession()
      }

      throw error
    }
  }, [setAnonymousSession])

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

        setSession({
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
      isAuthenticated: session.status === 'authenticated',
      isBootstrapping: session.status === 'bootstrapping',
      refreshSession,
      setAnonymousSession,
    }),
    [authenticateWithCurrentToken, refreshSession, session, setAnonymousSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
