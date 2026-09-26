'use client'

import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'

import { dictionaries, type Dictionary } from './dictionaries'
import { defaultLanguage, isLanguage, type Language } from './languages'

const languageStorageKey = 'picboard-language'

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary
}

type I18nState = {
  language: Language
}

type I18nAction =
  | {
      type: 'setLanguage'
      language: Language
    }
  | {
      type: 'restoreLanguage'
      language: Language
    }

const initialState: I18nState = {
  language: defaultLanguage,
}

const i18nReducer = (state: I18nState, action: I18nAction): I18nState => {
  switch (action.type) {
    case 'setLanguage':
    case 'restoreLanguage':
      return {
        ...state,
        language: action.language,
      }
  }
}

export const I18nContext = createContext<I18nContextValue | null>(null)

type I18nProviderProps = Readonly<{
  children: ReactNode
}>

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [state, dispatch] = useReducer(i18nReducer, initialState)

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(languageStorageKey)

    if (savedLanguage && isLanguage(savedLanguage)) {
      dispatch({
        type: 'restoreLanguage',
        language: savedLanguage,
      })
    }
  }, [])

  const setLanguage = (nextLanguage: Language): void => {
    dispatch({
      type: 'setLanguage',
      language: nextLanguage,
    })

    window.localStorage.setItem(languageStorageKey, nextLanguage)
  }

  const value = useMemo<I18nContextValue>(() => {
    return {
      language: state.language,
      setLanguage,
      t: dictionaries[state.language],
    }
  }, [state.language])

  return <I18nContext value={value}>{children}</I18nContext>
}
