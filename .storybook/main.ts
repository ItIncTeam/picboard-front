import type { StorybookConfig } from '@storybook/nextjs-vite'
import svgr from 'vite-plugin-svgr'

const svgrOptions = {
  icon: true,
  svgo: true,
  titleProp: true,
} as const

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      image: {
        excludeFiles: ['**/*.svg?react'],
      },
    },
  },
  staticDirs: ['../public'],

  viteFinal: async (config) => {
    config.plugins ??= []

    config.plugins.push(
      svgr({
        include: '**/*.svg?react',
        svgrOptions,
      }),
    )

    return config
  },
}

export default config
