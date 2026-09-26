import type { Preview } from '@storybook/nextjs-vite'

import '@/app/globals.css'

import { I18nProvider } from '@/shared/lib/i18n'

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'dark',
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'light' ? 'light' : 'dark'

      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = theme
      }

      return (
        <div
          data-theme={theme}
          style={{
            padding: 24,
            background: 'var(--color-background)',
            color: 'var(--color-text-primary)',
          }}
        >
          <I18nProvider>
            <Story />
          </I18nProvider>
        </div>
      )
    },
  ],

  parameters: {
    layout: 'padded',

    docs: {
      source: {
        state: 'open',
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },
}

export default preview
