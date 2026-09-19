import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '@/shared/lib/i18n'

import { DatePicker } from '../DatePicker'

describe('DatePicker', () => {
  const containers: HTMLDivElement[] = []
  const roots: ReturnType<typeof createRoot>[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    roots.forEach((root) => act(() => root.unmount()))
    containers.forEach((container) => container.remove())
    roots.length = 0
    containers.length = 0
  })

  it('uses its label as the accessible name when no date is selected', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    containers.push(container)
    roots.push(root)
    document.body.append(container)

    act(() => {
      root.render(
        <I18nProvider>
          <DatePicker label="Date of birth" value={null} />
        </I18nProvider>,
      )
    })

    const trigger = container.querySelector('button')
    const labelId = trigger?.getAttribute('aria-labelledby')

    expect(labelId).not.toBeNull()
    expect(labelId ? document.getElementById(labelId)?.textContent : null).toBe('Date of birth')
  })
})
