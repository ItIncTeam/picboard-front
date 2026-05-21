/* eslint-disable no-console */

import { spawnSync } from 'node:child_process'

const prettierExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.scss',
  '.md',
  '.mjs',
  '.cjs',
  '.yml',
  '.yaml',
])
const eslintExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const stylelintExtensions = new Set(['.css', '.scss'])

const getExtension = (file) => {
  const normalizedFile = file.toLowerCase()

  if (normalizedFile.endsWith('.yaml')) return '.yaml'
  if (normalizedFile.endsWith('.yml')) return '.yml'

  const dotIndex = normalizedFile.lastIndexOf('.')

  return dotIndex === -1 ? '' : normalizedFile.slice(dotIndex)
}

const run = (command, args) =>
  spawnSync(command, args, {
    shell: process.platform === 'win32' && command === 'pnpm',
    stdio: 'inherit',
  })

const addFile = (file) => run('git', ['add', file])

console.log('🔎 Pre-commit: проверяю staged-файлы')
console.log('   Хук легкий: запускает автоисправления только для файлов текущего коммита.')
console.log('')

const stagedFilesResult = spawnSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  },
)

if (stagedFilesResult.status !== 0) {
  process.exit(stagedFilesResult.status ?? 1)
}

const stagedFiles = stagedFilesResult.stdout
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)

if (stagedFiles.length === 0) {
  console.log('✅ Нет staged-файлов для проверки.')
  process.exit(0)
}

let fixed = 0
let failed = 0

for (const file of stagedFiles) {
  const extension = getExtension(file)

  if (prettierExtensions.has(extension)) {
    fixed += 1
    console.log(`🧹 prettier --write ${file}`)

    if (
      run('pnpm', ['exec', 'prettier', '--write', file]).status !== 0 ||
      addFile(file).status !== 0
    ) {
      failed = 1
      console.log('')
      console.log(`❌ Prettier не смог отформатировать или добавить файл: ${file}`)
      console.log(
        '   Проверь ошибку выше, поправь файл вручную, добавь его в stage и повтори commit.',
      )
      console.log('')
    }
  }

  if (eslintExtensions.has(extension)) {
    fixed += 1
    console.log(`🔧 eslint --fix ${file}`)

    if (run('pnpm', ['exec', 'eslint', '--fix', file]).status !== 0 || addFile(file).status !== 0) {
      failed = 1
      console.log('')
      console.log(`❌ ESLint не смог исправить или добавить файл: ${file}`)
      console.log(
        '   Часть ошибок требует ручной правки. Исправь файл, добавь его в stage и повтори commit.',
      )
      console.log('')
    }
  }

  if (stylelintExtensions.has(extension)) {
    fixed += 1
    console.log(`🎨 stylelint --fix ${file}`)

    if (
      run('pnpm', ['exec', 'stylelint', '--fix', file]).status !== 0 ||
      addFile(file).status !== 0
    ) {
      failed = 1
      console.log('')
      console.log(`❌ Stylelint не смог исправить или добавить файл: ${file}`)
      console.log(
        '   Часть ошибок требует ручной правки. Исправь файл, добавь его в stage и повтори commit.',
      )
      console.log('')
    }
  }
}

if (fixed === 0) {
  console.log('✅ Staged-файлы не требуют автоисправлений.')
  process.exit(0)
}

if (failed !== 0) {
  console.log('🚫 Commit остановлен.')
  console.log('   Исправь ошибки выше, добавь изменения в stage и повтори commit.')
  process.exit(1)
}

console.log('✅ Pre-commit пройден: staged-файлы исправлены и добавлены обратно.')
console.log('🎉 Commit можно завершать.')
