/* eslint-disable no-console */

import { spawnSync } from 'node:child_process'

console.log('🚀 Pre-push: проверяю ветку перед отправкой')
console.log('   Хук строгий: сначала форматирует проект, затем запускает read-only проверки.')
console.log('')

const run = (command, args, options = {}) =>
  spawnSync(command, args, {
    shell: process.platform === 'win32' && command === 'pnpm',
    stdio: 'inherit',
    ...options,
  })

const formatResult = run('pnpm', ['format'])

if (formatResult.status !== 0) {
  console.log('🚫 Push остановлен: Prettier не смог отформатировать проект.')
  process.exit(formatResult.status ?? 1)
}

const diffResult = spawnSync('git', ['diff', '--quiet'], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (diffResult.status !== 0) {
  console.log('🚫 Push остановлен: Prettier изменил файлы.')
  console.log('   Проверь diff, добавь форматирование в commit и повтори push.')
  process.exit(diffResult.status ?? 1)
}

const verifyResult = run('pnpm', ['check:verify'])

if (verifyResult.status !== 0) {
  console.log('🚫 Push остановлен.')
  process.exit(verifyResult.status ?? 1)
}

console.log('✅ Pre-push пройден: ветка готова к отправке.')
console.log('🎉 Push можно завершать.')
