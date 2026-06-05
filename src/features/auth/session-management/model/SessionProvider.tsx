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

import { clearAccessToken, setAccessToken } from '@/shared/lib/auth'

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

  const setAnonymousSession = useCallback(() => {
    clearAccessToken()

    setSession({
      status: 'anonymous',
      user: null,
    })
  }, [])

  const refreshSession = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshPromiseRef.current = (async () => {
      try {
        const { accessToken } = await refreshToken()

        if (!isMountedRef.current) {
          return
        }

        setAccessToken(accessToken)

        const user = await getMe()

        if (!isMountedRef.current) {
          return
        }

        setSession({
          status: 'authenticated',
          user,
        })
      } catch {
        if (!isMountedRef.current) {
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
      isAuthenticated: session.status === 'authenticated',
      isBootstrapping: session.status === 'bootstrapping',
      refreshSession,
      setAnonymousSession,
    }),
    [refreshSession, session, setAnonymousSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
