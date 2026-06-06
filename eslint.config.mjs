// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-nested-ternary': 'error',

      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
        },
      ],

      'react/button-has-type': 'error',
      'react/prop-types': 'off',
    },
  },

  // SVG React components must be imported only through shared assets API.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/assets/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.svg?react'],
              message: 'Import SVG React components only through "@/shared/assets".',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.stories.tsx'],
    rules: {
      'no-console': 'off',
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'storybook-static/**', 'next-env.d.ts']),

  prettier,

  ...storybook.configs['flat/recommended'],
])

export default eslintConfig
