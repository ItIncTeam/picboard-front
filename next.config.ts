import type { NextConfig } from 'next'

const svgrOptions = {
  icon: true,
  svgo: true,
  titleProp: true,
} as const

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        condition: {
          query: '?react',
        },
        loaders: [
          {
            loader: '@svgr/webpack',
            options: svgrOptions,
          },
        ],
        as: '*.js',
      },
    },
  },
}
export default nextConfig
