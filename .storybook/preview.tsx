import type { Preview } from '@storybook/nextjs-vite'

import '@/app/globals.css'

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
            minHeight: '100vh',
            padding: 24,
            color: 'var(--color-text-primary)',
            background: 'var(--color-background)',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
