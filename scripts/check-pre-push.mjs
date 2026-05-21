/* eslint-disable no-console */

import { spawnSync } from 'node:child_process'

console.log('🚀 Pre-push: проверяю ветку перед отправкой')
console.log('   Хук строгий: ветка сейчас будет отправлена на сервер.')
console.log('')

const result = spawnSync('pnpm', ['check:verify'], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.status !== 0) {
  console.log('🚫 Push остановлен.')
  process.exit(result.status ?? 1)
}

console.log('✅ Pre-push пройден: ветка готова к отправке.')
console.log('🎉 Push можно завершать.')
