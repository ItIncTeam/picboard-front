import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider, useI18n } from '@/shared/lib/i18n'

import { DatePicker } from './DatePicker'

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

function LanguageControls() {
  const { setLanguage } = useI18n()

  return (
    <>
      <button onClick={() => setLanguage('en')} type="button">
        English
      </button>
      <button onClick={() => setLanguage('ru')} type="button">
        Russian
      </button>
    </>
  )
}

function TranslationProbe() {
  const { t } = useI18n()

  return <p>{t.widgets.registeredUsersCounter.label}</p>
}

describe('DatePicker localization', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
  })

  it('updates mounted UI from English to Russian and back without reloading', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const view = { container, root }
    mountedRoots.push(view)
    document.body.append(container)

    act(() => {
      root.render(
        <I18nProvider>
          <LanguageControls />
          <TranslationProbe />
          <DatePicker defaultOpen today={new Date(2023, 10, 11)} />
        </I18nProvider>,
      )
    })

    expect(container.textContent).toContain('Registered users:')
    expect(container.textContent).toContain('Mo')
    expect(container.textContent).toContain('Su')

    const russianButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Russian',
    )
    act(() => russianButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(container.textContent).toContain('Зарегистрированные пользователи:')
    expect(container.textContent).toContain('Пн')
    expect(container.textContent).toContain('Вс')

    const englishButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'English',
    )
    act(() => englishButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(container.textContent).toContain('Registered users:')
    expect(container.textContent).toContain('Mo')
    expect(container.textContent).toContain('Su')
  })
})
